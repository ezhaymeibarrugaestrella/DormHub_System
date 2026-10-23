const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    try {
        const {
            student_id,
            fullname,
            email,
            password,
            program,
            year_section,
            room_number,
            address,
            parent_name,
            parent_contact,
            parent_address
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO users
            (student_id, fullname, email, password, role, program, year_section,
             room_number, address, parent_name, parent_contact, parent_address,
             registration_status, status)
            VALUES (?, ?, ?, ?, 'student', ?, ?, ?, ?, ?, ?, ?, 'pending', 'active')
        `;

        db.query(
            sql,
            [
                student_id, fullname, email, hashedPassword,
                program || null, year_section || null,
                room_number || null,
                address || null, parent_name || null,
                parent_contact || null, parent_address || null
            ],
            (err, result) => {
                if (err) {
                    return res.status(500).json(err);
                }

                const token = jwt.sign(
                    { id: result.insertId, role: "student" },
                    process.env.JWT_SECRET,
                    { expiresIn: "1d" }
                );

                res.status(201).json({
                    message: "Registration submitted. Please register your fingerprint.",
                    token,
                    user: {
                        id: result.insertId,
                        fullname,
                        email,
                        role: "student",
                        fingerprint_registered: false,
                        registration_status: "pending"
                    }
                });
            }
        );
    } catch (error) {
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

exports.getAll = (req, res) => {
    const role = req.user.role;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
    }

    db.query(
        `SELECT id, student_id, fullname, email, program, year_section,
                address, parent_name, parent_contact, parent_address,
                registration_status, fingerprint_registered,
                created_at
         FROM users
         WHERE role = 'student' AND registration_status IS NOT NULL
         ORDER BY
            CASE registration_status
                WHEN 'pending' THEN 0
                WHEN 'approved' THEN 1
                WHEN 'rejected' THEN 2
            END,
            created_at DESC`,
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

exports.getPendingCount = (req, res) => {
    db.query(
        "SELECT COUNT(*) AS count FROM users WHERE role = 'student' AND registration_status = 'pending'",
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ count: result[0].count });
        }
    );
};

exports.updateStatus = (req, res) => {
    const role = req.user.role;
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    db.query(
        "UPDATE users SET registration_status = ?, registration_remarks = ? WHERE id = ? AND role = 'student'",
        [status, remarks || null, id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Student not found" });
            }
            res.json({ message: `Registration ${status} successfully` });
        }
    );
};
