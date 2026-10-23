const db = require("../config/db");
const bcrypt = require("bcryptjs");

exports.getAll = (req, res) => {
    const sql = `
        SELECT id, fullname, student_id, email, role, program, year_section,
               room_number, address, parent_name, parent_contact, parent_address,
               status, registration_status, registration_remarks,
               fingerprint_registered, profile_picture, created_at
        FROM users
        ORDER BY fullname
    `;
    db.query(sql, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.getById = (req, res) => {
    const sql = `
        SELECT id, fullname, student_id, email, role, program, year_section,
               room_number, address, parent_name, parent_contact, parent_address,
               status, registration_status, registration_remarks,
               fingerprint_registered, profile_picture, created_at
        FROM users WHERE id = ?
    `;
    db.query(sql, [req.params.id], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "User not found" });
        res.json(results[0]);
    });
};

exports.update = async (req, res) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can update users" });
    }

    const { fullname, email, role, program, year_section, room_number, address, parent_name, parent_contact, parent_address, status, password } = req.body;
    const userId = req.params.id;

    let sql = "UPDATE users SET fullname = ?, email = ?, program = ?, year_section = ?, room_number = ?, address = ?, parent_name = ?, parent_contact = ?, parent_address = ?";
    const params = [fullname, email, program || null, year_section || null, room_number || null, address || null, parent_name || null, parent_contact || null, parent_address || null];

    if (role) {
        sql += ", role = ?";
        params.push(role);
    }
    if (status) {
        sql += ", status = ?";
        params.push(status);
    }
    if (password) {
        const hashed = await bcrypt.hash(password, 10);
        sql += ", password = ?";
        params.push(hashed);
    }

    sql += " WHERE id = ?";
    params.push(userId);

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User updated successfully" });
    });
};

exports.remove = (req, res) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can delete users" });
    }

    const userId = req.params.id;

    db.query("SELECT role FROM users WHERE id = ?", [userId], (err, results) => {
        if (err) return res.status(500).json(err);
        if (results.length === 0) return res.status(404).json({ message: "User not found" });

        if (results[0].role === "superadmin") {
            return res.status(403).json({ message: "Cannot delete a superadmin account" });
        }

        db.query("DELETE FROM users WHERE id = ?", [userId], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "User deleted successfully" });
        });
    });
};
