require("dotenv").config();

const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

require("../models");
const User = require("../models/User");
const { loginLimiter } = require("../config/rateLimits");
const { cleanup, TEST_EMAIL_PREFIX } = require("./phase1-cleanup");

const BASE = process.env.BASE_URL || "http://127.0.0.1:5000";

const ADMIN_EMAIL = "superadmin@dormhub.com";
const ADMIN_PASSWORD = "admin123";

const results = [];

function check(name, pass, detail = "") {
    results.push({ name, pass: Boolean(pass), detail });
    console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

async function api(method, path, body, token) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined
    });

    let data = null;
    try {
        data = await res.json();
    } catch (e) {
        data = null;
    }
    return { status: res.status, data };
}

function tokenFromLink(link) {
    return new URL(link).searchParams.get("token");
}

async function freshLogin(email, password) {
    return api("POST", "/api/auth/login", { email, password });
}

async function run() {
    console.log("== Phase 1 verification suite (read-only except test fixtures) ==\n");

    await cleanup();
    console.log("Pre-run cleanup done (stale fixtures removed).\n");

    // --- Regression: existing admin login (grandfathered as verified) ---
    const adminLogin = await freshLogin(ADMIN_EMAIL, ADMIN_PASSWORD);
    check(
        "T01 admin login regression (legacy account grandfathered)",
        adminLogin.status === 200 && adminLogin.data?.user?.role === "superadmin",
        `status=${adminLogin.status}`
    );
    const adminToken = adminLogin.data?.token;

    // --- T02/T03 login enumeration fix ---
    const unknown = await freshLogin("phase1-test-nobody@example.com", "whatever123");
    const wrongPw = await freshLogin(ADMIN_EMAIL, "definitely-wrong-123");
    check(
        "T02 unknown email -> 401",
        unknown.status === 401,
        `status=${unknown.status} msg=${JSON.stringify(unknown.data?.message)}`
    );
    check(
        "T03 wrong password -> 401",
        wrongPw.status === 401,
        `status=${wrongPw.status} msg=${JSON.stringify(wrongPw.data?.message)}`
    );
    check(
        "T04 both login failures return identical status and message (no enumeration)",
        unknown.status === wrongPw.status && unknown.data?.message === wrongPw.data?.message,
        `msg=${JSON.stringify(unknown.data?.message)}`
    );

    // --- T05 privilege escalation via public register (B1) ---
    const roleAttack = await api("POST", "/api/auth/register", {
        fullname: "Phase One Role Test",
        email: `${TEST_EMAIL_PREFIX}role@example.com`,
        password: "testpass123",
        role: "superadmin"
    });
    const roleAttackDb = await User.findOne({ email: `${TEST_EMAIL_PREFIX}role@example.com` });
    check(
        "T05 role injection blocked (register with role=superadmin stores role=student)",
        roleAttack.status === 201 && roleAttackDb && roleAttackDb.role === "student",
        `http=${roleAttack.status} db_role=${roleAttackDb && roleAttackDb.role}`
    );

    // --- T06..T10 student registration + verification flow ---
    const student1 = {
        student_id: "PH1-TEST-001",
        fullname: "Phase One Test",
        email: `${TEST_EMAIL_PREFIX}1@example.com`,
        password: "testpass123",
        program: "BSIT",
        year_section: "1st Year",
        room_number: "T-101",
        address: "123 Test Street",
        parent_name: "Test Parent",
        parent_contact: "09171234567",
        parent_address: "456 Test Avenue"
    };

    const reg1 = await api("POST", "/api/student-registration/register", student1);
    check(
        "T06 student registration returns verification requirement + scoped token",
        reg1.status === 201 &&
            reg1.data?.verification?.required === true &&
            Boolean(reg1.data?.token) &&
            jwt.decode(reg1.data.token)?.scope === "registration",
        `http=${reg1.status} scope=${jwt.decode(reg1.data?.token || "")?.scope}`
    );
    const scopedToken = reg1.data?.token;

    const loginUnverified = await freshLogin(student1.email, student1.password);
    check(
        "T07 unverified student cannot log in (403 requires_verification)",
        loginUnverified.status === 403 && loginUnverified.data?.requires_verification === true,
        `http=${loginUnverified.status}`
    );

    const scopedDenied = await api("GET", "/api/users", undefined, scopedToken);
    check(
        "T08 registration-scoped token rejected outside biometric enrollment",
        scopedDenied.status === 401,
        `http=${scopedDenied.status} msg=${JSON.stringify(scopedDenied.data?.message)}`
    );

    const scopedAllowed = await api("POST", "/api/webauthn/register/begin", {}, scopedToken);
    check(
        "T09 registration-scoped token accepted on biometric enrollment route",
        scopedAllowed.status === 200,
        `http=${scopedAllowed.status}`
    );

    const badVerify = await api("POST", "/api/auth/verify-email", { token: "not-a-real-token" });
    check(
        "T10 bogus verification token -> 400",
        badVerify.status === 400,
        `http=${badVerify.status}`
    );

    const devLink1 = reg1.data?.verification?.dev_link;
    check("T11 dev-mode verification link returned on registration", Boolean(devLink1), devLink1 ? "link present" : "missing");

    const verify1 = await api("POST", "/api/auth/verify-email", { token: tokenFromLink(devLink1) });
    const user1After = await User.findOne({ email: student1.email });
    check(
        "T12 valid verification token verifies email",
        verify1.status === 200 && user1After?.email_verified === true,
        `http=${verify1.status} verified=${user1After && user1After.email_verified}`
    );

    const reuse = await api("POST", "/api/auth/verify-email", { token: tokenFromLink(devLink1) });
    check(
        "T13 verification token is single-use",
        reuse.status === 400,
        `http=${reuse.status}`
    );

    const loginPending = await freshLogin(student1.email, student1.password);
    check(
        "T14 verified-but-pending student still blocked by approval gate (no requires_verification)",
        loginPending.status === 403 &&
            /pending approval/i.test(loginPending.data?.message || "") &&
            !loginPending.data?.requires_verification,
        `http=${loginPending.status} msg=${JSON.stringify(loginPending.data?.message)}`
    );

    // --- T15/T16 resend behaviour ---
    const resendUnknown = await api("POST", "/api/auth/resend-verification", {
        email: "phase1-test-nobody@example.com"
    });
    check(
        "T15 resend for unknown email returns generic success without link",
        resendUnknown.status === 200 && !resendUnknown.data?.dev_link,
        `http=${resendUnknown.status}`
    );

    const student2 = { ...student1, student_id: "PH1-TEST-002", email: `${TEST_EMAIL_PREFIX}2@example.com` };
    const reg2 = await api("POST", "/api/student-registration/register", student2);
    const oldLink2 = reg2.data?.verification?.dev_link;
    const resend2 = await api("POST", "/api/auth/resend-verification", { email: student2.email });
    check(
        "T16 resend for unverified account returns a new link",
        resend2.status === 200 && Boolean(resend2.data?.dev_link),
        `http=${resend2.status}`
    );

    const oldTokenRejected = await api("POST", "/api/auth/verify-email", { token: tokenFromLink(oldLink2) });
    const newTokenAccepted = await api("POST", "/api/auth/verify-email", { token: tokenFromLink(resend2.data.dev_link) });
    check(
        "T17 resend invalidates the previous token",
        oldTokenRejected.status === 400 && newTokenAccepted.status === 200,
        `old=${oldTokenRejected.status} new=${newTokenAccepted.status}`
    );

    // --- T18..T21 profile email change requires re-verification ---
    await User.updateOne(
        { email: student1.email },
        { $set: { registration_status: "approved" } }
    );
    const approvedLogin = await freshLogin(student1.email, student1.password);
    check(
        "T18 approved + verified student logs in normally",
        approvedLogin.status === 200 && Boolean(approvedLogin.data?.token),
        `http=${approvedLogin.status}`
    );
    const studentToken = approvedLogin.data?.token;

    const newEmail = `${TEST_EMAIL_PREFIX}1-renamed@example.com`;
    const profileUpdate = await api(
        "PUT",
        "/api/settings/profile",
        { fullname: student1.fullname, email: newEmail, program: student1.program, year_section: student1.year_section },
        studentToken
    );
    check(
        "T19 changing email flags re-verification and returns dev link",
        profileUpdate.status === 200 &&
            profileUpdate.data?.requires_verification === true &&
            Boolean(profileUpdate.data?.dev_link),
        `http=${profileUpdate.status}`
    );

    const loginNewUnverified = await freshLogin(newEmail, student1.password);
    check(
        "T20 login with changed (unverified) email blocked",
        loginNewUnverified.status === 403 && loginNewUnverified.data?.requires_verification === true,
        `http=${loginNewUnverified.status}`
    );

    const verifyNew = await api("POST", "/api/auth/verify-email", { token: tokenFromLink(profileUpdate.data.dev_link) });
    const finalLogin = await freshLogin(newEmail, student1.password);
    check(
        "T21 after re-verification the account logs in again",
        verifyNew.status === 200 && finalLogin.status === 200,
        `verify=${verifyNew.status} login=${finalLogin.status}`
    );

    const profile = await api("GET", "/api/settings/profile", undefined, finalLogin.data?.token);
    check(
        "T22 profile read works with a normal token (regression)",
        profile.status === 200 && profile.data?.email === newEmail,
        `http=${profile.status}`
    );

    const attendanceToday = await api("GET", "/api/attendance/today", undefined, adminToken);
    check(
        "T23 unrelated authenticated endpoint regression (attendance/today)",
        attendanceToday.status === 200,
        `http=${attendanceToday.status}`
    );

    // --- T24 rate limiter configuration (in-process, shares config module) ---
    const probe = await new Promise((resolve) => {
        const app = express();
        app.use(express.json());
        app.use("/login", loginLimiter, (req, res) =>
            res.status(401).json({ message: "Invalid email or password" })
        );
        const srv = app.listen(5099, async () => {
            let saw429 = false;
            let last = 0;
            for (let i = 0; i < 45 && !saw429; i++) {
                const r = await fetch("http://127.0.0.1:5099/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: ADMIN_EMAIL, password: "wrong" })
                });
                last = r.status;
                if (r.status === 429) saw429 = true;
            }
            srv.close(() => resolve({ saw429, last }));
        });
    });
    check(
        "T24 login rate limiter returns 429 after the allowed number of failures",
        probe.saw429,
        `last=${probe.last}`
    );

    // --- T25 live-server wiring proof (resend limiter; affects only resend for ~15 min) ---
    let live429 = false;
    let liveLast = 0;
    for (let i = 0; i < 25 && !live429; i++) {
        const r = await api("POST", "/api/auth/resend-verification", {});
        liveLast = r.status;
        if (r.status === 429) live429 = true;
    }
    check(
        "T25 rate limiting wired on the live server (resend endpoint)",
        live429,
        `last=${liveLast} (note: resend is now throttled for ~15 minutes)`
    );

    // --- Cleanup test fixtures ---
    const deleted = await cleanup();
    console.log(
        `\nFixture cleanup: ${deleted.users} users, ${deleted.tokens} tokens, ` +
            `${deleted.faces} face descriptors, ${deleted.webauthn} webauthn credentials removed`
    );

    const failed = results.filter((r) => !r.pass);
    console.log(`\n== RESULT: ${results.length - failed.length}/${results.length} passed ==`);
    if (failed.length) {
        failed.forEach((f) => console.log(`  FAILED: ${f.name} ${f.detail}`));
    }

    await mongoose.disconnect();
    process.exit(failed.length ? 1 : 0);
}

mongoose
    .connect(process.env.MONGODB_URI)
    .then(() => run())
    .catch(async (err) => {
        console.error("FATAL:", err);
        try {
            await mongoose.disconnect();
        } catch (e) {}
        process.exit(1);
    });
