const db = require("../config/db");

exports.getAll = (req, res) => {
    db.query(
        `SELECT d.*, u.fullname, u.student_id, u.room_number
         FROM demerits d
         JOIN users u ON d.user_id = u.id
         ORDER BY d.created_at DESC`,
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

exports.getByUser = (req, res) => {
    db.query(
        "SELECT * FROM demerits WHERE user_id = ? ORDER BY created_at DESC",
        [req.user.id],
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

exports.getSummary = (req, res) => {
    db.query(
        `SELECT u.id, u.fullname, u.student_id,
                COUNT(d.id) AS total_demerits,
                COALESCE(SUM(d.points), 0) AS total_points
         FROM users u
         LEFT JOIN demerits d ON u.id = d.user_id
         WHERE u.role = 'student'
         GROUP BY u.id
         ORDER BY total_points DESC`,
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

exports.create = (req, res) => {
    const { user_id, violation, points } = req.body;

    if (!user_id || !violation) {
        return res.status(400).json({ message: "User ID and violation are required" });
    }

    db.query(
        "INSERT INTO demerits (user_id, violation, points) VALUES (?, ?, ?)",
        [user_id, violation, points || 1],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(201).json({ message: "Demerit added", id: result.insertId });
        }
    );
};

exports.remove = (req, res) => {
    const { id } = req.params;

    db.query("DELETE FROM demerits WHERE id = ?", [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Demerit not found" });
        }
        res.json({ message: "Demerit removed" });
    });
};
