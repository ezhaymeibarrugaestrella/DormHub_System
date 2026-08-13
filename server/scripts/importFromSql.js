require("dotenv").config();

const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const User = require("../models/User");
const GateRequest = require("../models/GateRequest");
const Demerit = require("../models/Demerit");
const NightlyAttendance = require("../models/NightlyAttendance");
const WebauthnCredential = require("../models/WebauthnCredential");

const SQL_FILE = path.resolve(__dirname, "../../dormhub_db.sql");

function splitValueGroups(text) {
    const groups = [];
    let i = 0;

    while (i < text.length) {
        while (i < text.length && /[\s,;]/.test(text[i])) i++;
        if (i >= text.length) break;

        if (text[i] === "(") {
            const start = i;
            i++;
            let depth = 1;

            while (i < text.length && depth > 0) {
                const ch = text[i];
                if (ch === "\\") {
                    i += 2;
                    continue;
                }
                if (ch === "'") {
                    i++;
                    while (i < text.length && text[i] !== "'") {
                        if (text[i] === "\\") i++;
                        i++;
                    }
                    i++;
                    continue;
                }
                if (ch === "(") depth++;
                else if (ch === ")") depth--;
                i++;
            }

            groups.push(text.slice(start, i));
        } else {
            i++;
        }
    }

    return groups;
}

function splitValues(tuple) {
    tuple = tuple.trim();
    if (tuple.startsWith("(")) tuple = tuple.slice(1);
    if (tuple.endsWith(")")) tuple = tuple.slice(0, -1);

    const values = [];
    let i = 0;
    let cur = "";

    while (i < tuple.length) {
        const ch = tuple[i];

        if (ch === "'") {
            let s = "'";
            i++;
            while (i < tuple.length) {
                if (tuple[i] === "\\" && i + 1 < tuple.length) {
                    s += tuple[i] + tuple[i + 1];
                    i += 2;
                } else if (tuple[i] === "'") {
                    s += "'";
                    i++;
                    break;
                } else {
                    s += tuple[i];
                    i++;
                }
            }
            cur += s;
        } else if (ch === ",") {
            values.push(cur.trim());
            cur = "";
            i++;
        } else {
            cur += ch;
            i++;
        }
    }

    values.push(cur.trim());
    return values;
}

function interpretToken(token) {
    if (token === "NULL") return null;
    if (/^\d+$/.test(token)) return Number(token);
    if (/^-?\d*\.\d+$/.test(token)) return Number(token);
    if (token.startsWith("'")) {
        return token
            .slice(1, -1)
            .replace(/\\'/g, "'")
            .replace(/\\"/g, '"')
            .replace(/\\\\/g, "\\");
    }
    return token;
}

function toDate(value) {
    if (value == null || value === "") return null;
    if (value instanceof Date) return value;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value)) {
        return new Date(value.replace(" ", "T") + "Z");
    }
    return new Date(value);
}

function parseInserts(sql) {
    const inserts = [];
    const pattern = /INSERT INTO `(\w+)`\s*\(([^)]*)\)\s*VALUES\s*([\s\S]*?);/g;
    let match;

    while ((match = pattern.exec(sql)) !== null) {
        const table = match[1];
        const columns = match[2].split(",").map((c) => c.trim().replace(/`/g, ""));
        const rows = splitValueGroups(match[3]).map((group) => {
            const raw = splitValues(group);
            const row = {};
            columns.forEach((col, idx) => {
                row[col] = interpretToken(raw[idx]);
            });
            return row;
        });
        inserts.push({ table, rows });
    }

    return inserts;
}

const BOOLEAN_FIELDS = {
    users: ["fingerprint_registered"],
    gate_requests: ["fingerprint_verified"]
};

const TIMESTAMP_FIELDS = {
    users: ["created_at"],
    gate_requests: ["created_at", "updated_at"],
    demerits: ["created_at"],
    nightly_attendance: ["created_at", "checked_at"],
    webauthn_credentials: ["created_at"]
};

const REF_FIELDS = {
    users: [],
    gate_requests: ["user_id", "approved_by"],
    demerits: ["user_id"],
    nightly_attendance: ["user_id"],
    webauthn_credentials: ["user_id"]
};

async function importData() {
    if (!fs.existsSync(SQL_FILE)) {
        console.error(`SQL file not found: ${SQL_FILE}`);
        process.exit(1);
    }

    const sql = fs.readFileSync(SQL_FILE, "utf8");

    await mongoose.connect(
        process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dormhub_db"
    );
    console.log("MongoDB Connected...");

    const inserts = parseInserts(sql);
    const tables = inserts.map((i) => i.table);
    console.log("Found data in tables:", tables.join(", "));

    inserts.sort((a, b) => {
        if (a.table === "users") return -1;
        if (b.table === "users") return 1;
        return 0;
    });

    const legacyIdMap = new Map();
    const total = {};

    const clean = await Promise.all([
        User.deleteMany({ legacy_id: { $exists: true } }),
        GateRequest.deleteMany({ legacy_id: { $exists: true } }),
        Demerit.deleteMany({ legacy_id: { $exists: true } }),
        NightlyAttendance.deleteMany({ legacy_id: { $exists: true } }),
        WebauthnCredential.deleteMany({ legacy_id: { $exists: true } })
    ]);
    const cleanedCount = clean.reduce((sum, r) => sum + r.deletedCount, 0);
    if (cleanedCount > 0) {
        console.log(`Cleaned up ${cleanedCount} previously-imported document(s)`);
    }

    for (const insert of inserts) {
        const { table, rows } = insert;

        let Model;
        if (table === "users") Model = User;
        else if (table === "gate_requests") Model = GateRequest;
        else if (table === "demerits") Model = Demerit;
        else if (table === "nightly_attendance") Model = NightlyAttendance;
        else if (table === "webauthn_credentials") Model = WebauthnCredential;
        else {
            console.log(`Skipping unknown table: ${table}`);
            continue;
        }

        const timestampFields = TIMESTAMP_FIELDS[table] || [];
        const booleanFields = BOOLEAN_FIELDS[table] || [];
        const refFields = REF_FIELDS[table] || [];

        let imported = 0;

        for (const row of rows) {
            const doc = {};

            for (const [key, value] of Object.entries(row)) {
                if (key === "id") {
                    if (table === "users") doc.legacy_id = value;
                    continue;
                }

                if (timestampFields.includes(key)) {
                    doc[key] = toDate(value);
                    continue;
                }

                if (booleanFields.includes(key)) {
                    doc[key] = Boolean(value);
                    continue;
                }

                if (refFields.includes(key)) {
                    const target = value == null ? null : legacyIdMap.get(value);
                    if (value != null && !target) {
                        console.warn(`  Missing legacy user ${value} referenced by ${table}`);
                    }
                    doc[key] = target;
                    continue;
                }

                doc[key] = value == null ? null : value;
            }

            if (table === "users") {
                const created = await User.create(doc);
                legacyIdMap.set(doc.legacy_id, created._id);
            } else {
                await Model.create(doc);
            }

            imported++;
        }

        total[table] = imported;
        console.log(`Imported ${imported} row(s) into ${table}`);
    }

    console.log("Import complete:", total);
    process.exit(0);
}

importData().catch((err) => {
    console.error("Import failed:", err);
    process.exit(1);
});
