const db = require("../config/db");

exports.getAll = (req, res) => {
    const { date, student_id, status } = req.query;

    let sql = `
        SELECT a.*, u.fullname, u.student_id, u.program, u.year_section,
               m.fullname AS marked_by_name
        FROM attendance_logs a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN users m ON a.marked_by = m.id
        WHERE 1=1
    `;
    const params = [];

    if (date) {
        sql += " AND a.date = ?";
        params.push(date);
    }
    if (student_id) {
        sql += " AND u.student_id LIKE ?";
        params.push(`%${student_id}%`);
    }
    if (status) {
        sql += " AND a.status = ?";
        params.push(status);
    }

    sql += " ORDER BY a.date DESC, a.time_in DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.getToday = (req, res) => {
    const today = new Date().toISOString().split("T")[0];

    db.query(
        `SELECT a.*, u.fullname, u.student_id, u.program, u.year_section
         FROM attendance_logs a
         JOIN users u ON a.user_id = u.id
         WHERE a.date = ?
         ORDER BY a.time_in DESC`,
        [today],
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

exports.markAttendance = (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can mark attendance" });
    }

    const { user_id, date, time_in, time_out, status, remarks } = req.body;

    if (!user_id || !date) {
        return res.status(400).json({ message: "User ID and date are required" });
    }

    db.query(
        "SELECT id FROM attendance_logs WHERE user_id = ? AND date = ?",
        [user_id, date],
        (err, existing) => {
            if (err) return res.status(500).json(err);
            if (existing.length > 0) {
                return res.status(409).json({ message: "Attendance already marked for this student on this date" });
            }

            db.query(
                `INSERT INTO attendance_logs (user_id, date, time_in, time_out, status, remarks, marked_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [user_id, date, time_in || null, time_out || null, status || "present", remarks || null, req.user.id],
                (err, result) => {
                    if (err) return res.status(500).json(err);
                    res.status(201).json({ message: "Attendance marked successfully", id: result.insertId });
                }
            );
        }
    );
};

exports.getStudents = (req, res) => {
    db.query(
        "SELECT id, fullname, student_id, program, year_section FROM users WHERE role = 'student' ORDER BY fullname ASC",
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};

function getNightlyDate() {
    const now = new Date();
    const hour = now.getHours();
    const date = new Date(now);
    if (hour < 6) {
        date.setDate(date.getDate() - 1);
    }
    return date.toISOString().split("T")[0];
}

exports.nightlyCheckIn = (req, res) => {
    const userId = req.user.id;
    const nightlyDate = getNightlyDate();
    const { locationLat, locationLng } = req.body;

    db.query(
        "SELECT id FROM nightly_attendance WHERE user_id = ? AND date = ?",
        [userId, nightlyDate],
        (err, existing) => {
            if (err) return res.status(500).json(err);
            if (existing.length > 0) {
                return res.status(409).json({ message: "Already checked in for tonight" });
            }

            db.query(
                "INSERT INTO nightly_attendance (user_id, date, status, checked_at, location_lat, location_lng) VALUES (?, ?, 'checked_in', NOW(), ?, ?)",
                [userId, nightlyDate, locationLat || null, locationLng || null],
                (err, result) => {
                    if (err) return res.status(500).json(err);
                    res.status(201).json({ message: "Nightly check-in successful" });
                }
            );
        }
    );
};

exports.getNightlyAttendance = (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can view nightly attendance" });
    }

    const nightlyDate = req.query.date || getNightlyDate();

    db.query(
        `SELECT u.id, u.fullname, u.student_id, u.program, u.year_section,
                n.status, n.checked_at, n.location_lat, n.location_lng
         FROM users u
         LEFT JOIN nightly_attendance n ON u.id = n.user_id AND n.date = ?
         WHERE u.role = 'student'
         ORDER BY u.fullname ASC`,
        [nightlyDate],
        (err, results) => {
            if (err) return res.status(500).json(err);
            const checkedCount = results.filter((s) => s.status === "checked_in").length;
            res.json({ date: nightlyDate, total: results.length, checkedIn: checkedCount, students: results });
        }
    );
};

exports.getStudentNightlyStatus = (req, res) => {
    const userId = req.user.id;
    const nightlyDate = getNightlyDate();

    db.query(
        "SELECT status, checked_at, date FROM nightly_attendance WHERE user_id = ? AND date = ?",
        [userId, nightlyDate],
        (err, results) => {
            if (err) return res.status(500).json(err);
            if (results.length > 0) {
                res.json({ checkedIn: true, status: results[0].status, checkedAt: results[0].checked_at, date: results[0].date });
            } else {
                res.json({ checkedIn: false, status: "pending", date: nightlyDate });
            }
        }
    );
};

exports.updateAttendance = (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can update attendance" });
    }

    const { id } = req.params;
    const { time_in, time_out, status, remarks } = req.body;

    db.query(
        "UPDATE attendance_logs SET time_in = COALESCE(?, time_in), time_out = COALESCE(?, time_out), status = COALESCE(?, status), remarks = COALESCE(?, remarks) WHERE id = ?",
        [time_in || null, time_out || null, status || null, remarks || null, id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: "Attendance record not found" });
            }
            res.json({ message: "Attendance updated successfully" });
        }
    );
};
