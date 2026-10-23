const db = require("../config/db");

exports.getAll = (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;

    if (role === "superadmin" || role === "staff") {
        db.query(
            `SELECT gr.*, u.fullname, u.student_id, u.room_number,
                    a.fullname AS approved_by_name
             FROM gate_requests gr
             JOIN users u ON gr.user_id = u.id
             LEFT JOIN users a ON gr.approved_by = a.id
             ORDER BY gr.created_at DESC`,
            (err, results) => {
                if (err) return res.status(500).json(err);
                res.json(results);
            }
        );
    } else {
        db.query(
            `SELECT gr.*, a.fullname AS approved_by_name
             FROM gate_requests gr
             LEFT JOIN users a ON gr.approved_by = a.id
             WHERE gr.user_id = ?
             ORDER BY gr.created_at DESC`,
            [userId],
            (err, results) => {
                if (err) return res.status(500).json(err);
                res.json(results);
            }
        );
    }
};

exports.getPendingCount = (req, res) => {
    db.query(
        "SELECT COUNT(*) AS count FROM gate_requests WHERE status = 'pending'",
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ count: result[0].count });
        }
    );
};

exports.getRecent = (req, res) => {
    db.query(
        `SELECT gr.*, u.fullname, u.student_id, a.fullname AS approved_by_name
         FROM gate_requests gr
         JOIN users u ON gr.user_id = u.id
         LEFT JOIN users a ON gr.approved_by = a.id
         ORDER BY gr.created_at DESC LIMIT 5`,
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

exports.create = (req, res) => {
    const userId = req.user.id;
    const { requestType, locationLat, locationLng } = req.body;

    if (!requestType || !["in", "out"].includes(requestType)) {
        return res.status(400).json({ message: "Valid request type required (in/out)" });
    }

    db.query(
        `INSERT INTO gate_requests
        (user_id, request_type, location_lat, location_lng, fingerprint_verified)
        VALUES (?, ?, ?, ?, TRUE)`,
        [userId, requestType, locationLat || null, locationLng || null],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.status(201).json({
                message: "Gate request submitted successfully",
                id: result.insertId
            });
        }
    );
};

exports.update = (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can approve/reject requests" });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    db.query(
        "UPDATE gate_requests SET status = ?, remarks = ?, approved_by = ? WHERE id = ?",
        [status, remarks || null, userId, id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Gate request not found" });
            }
            res.json({ message: `Request ${status} successfully` });
        }
    );
};
