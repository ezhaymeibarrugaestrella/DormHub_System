const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getProfile = (req, res) => {
    db.query(
        "SELECT id, fullname, email, student_id, role, program, year_section, room_number, address, parent_name, parent_contact, profile_picture, status, fingerprint_registered FROM users WHERE id = ?",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json(err);
            if (results.length === 0) return res.status(404).json({ message: "User not found" });
            res.json(results[0]);
        }
    );
};

exports.updateProfile = (req, res) => {
    const { fullname, email, program, year_section } = req.body;

    db.query(
        "UPDATE users SET fullname = ?, email = ?, program = ?, year_section = ? WHERE id = ?",
        [fullname, email, program || null, year_section || null, req.user.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Profile updated" });
        }
    );
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    db.query("SELECT password FROM users WHERE id = ?", [req.user.id], async (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "User not found" });

        const valid = await bcrypt.compare(currentPassword, results[0].password);
        if (!valid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, req.user.id], (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Password changed successfully" });
        });
    });
};

exports.getSystemInfo = (req, res) => {
    const info = {};

    db.query("SELECT COUNT(*) AS total FROM users", (err, users) => {
        info.totalUsers = users[0]?.total || 0;

        db.query("SELECT COUNT(*) AS total FROM gate_requests", (err, requests) => {
            info.totalGateRequests = requests[0]?.total || 0;

            db.query("SELECT COUNT(*) AS total FROM webauthn_credentials", (err, creds) => {
                info.totalBiometricRegistrations = creds[0]?.total || 0;
                info.serverTime = new Date().toISOString();
                res.json(info);
            });
        });
    });
};
