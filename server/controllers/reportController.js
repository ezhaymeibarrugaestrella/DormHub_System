const db = require("../config/db");

exports.getAttendanceReport = (req, res) => {
    const { start, end } = req.query;
    let sql = `
        SELECT a.*, u.fullname, u.student_id, u.program, u.year_section
        FROM attendance_logs a
        JOIN users u ON a.user_id = u.id
    `;
    const params = [];

    if (start && end) {
        sql += " WHERE DATE(a.created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    sql += " ORDER BY a.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.getDemeritReport = (req, res) => {
    const { start, end } = req.query;
    let sql = `
        SELECT d.*, u.fullname, u.student_id, u.program
        FROM demerits d
        JOIN users u ON d.user_id = u.id
    `;
    const params = [];

    if (start && end) {
        sql += " WHERE DATE(d.created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    sql += " ORDER BY d.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.getGateRequestReport = (req, res) => {
    const { start, end, status } = req.query;
    let sql = `
        SELECT gr.*, u.fullname, u.student_id, u.room_number
        FROM gate_requests gr
        JOIN users u ON gr.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (start && end) {
        sql += " AND DATE(gr.created_at) BETWEEN ? AND ?";
        params.push(start, end);
    }

    if (status) {
        sql += " AND gr.status = ?";
        params.push(status);
    }

    sql += " ORDER BY gr.created_at DESC";

    db.query(sql, params, (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.getReportSummary = (req, res) => {
    const { start, end } = req.query;
    const dateFilter = (start && end) ? " WHERE DATE(created_at) BETWEEN ? AND ?" : "";
    const params = (start && end) ? [start, end] : [];

    const queries = [
        db.promise().query(`SELECT COUNT(*) AS total FROM attendance_logs${dateFilter}`, params),
        db.promise().query(`SELECT COUNT(*) AS total FROM demerits${dateFilter}`, params),
        db.promise().query(`SELECT COUNT(*) AS total FROM gate_requests${dateFilter}`, params),
        db.promise().query(`SELECT COUNT(*) AS pending FROM gate_requests${dateFilter ? dateFilter + " AND status='pending'" : " WHERE status='pending'"}`, params),
        db.promise().query(`SELECT COUNT(*) AS approved FROM gate_requests${dateFilter ? dateFilter + " AND status='approved'" : " WHERE status='approved'"}`, params),
    ];

    Promise.all(queries.map(q => q.catch(() => [{ total: 0 }])))
        .then(([attendance, demerits, gateRequests, pending, approved]) => {
            res.json({
                totalAttendance: attendance[0][0]?.total || 0,
                totalDemerits: demerits[0][0]?.total || 0,
                totalGateRequests: gateRequests[0][0]?.total || 0,
                pendingRequests: pending[0][0]?.pending || 0,
                approvedRequests: approved[0][0]?.approved || 0
            });
        })
        .catch((err) => {
            console.error(err);
            res.status(500).json(err);
        });
};

exports.getMonthlyReport = (req, res) => {
    const { month } = req.query;
    if (!month) {
        return res.status(400).json({ error: "Month parameter required (YYYY-MM)" });
    }

    const sql = `
        SELECT
            u.id,
            u.fullname,
            u.student_id,
            u.program,
            u.year_section,
            u.room_number,
            (SELECT COALESCE(SUM(points), 0) FROM demerits WHERE user_id = u.id AND DATE_FORMAT(created_at, '%Y-%m') = ?) AS total_demerit_points,
            (SELECT COUNT(*) FROM gate_requests WHERE user_id = u.id AND request_type = 'out' AND status = 'approved' AND DATE_FORMAT(created_at, '%Y-%m') = ?) AS total_going_out,
            (SELECT COUNT(*) FROM gate_requests WHERE user_id = u.id AND request_type = 'in' AND status = 'approved' AND DATE_FORMAT(created_at, '%Y-%m') = ?) AS total_coming_in
        FROM users u
        WHERE u.role = 'student'
        ORDER BY u.fullname
    `;

    db.query(sql, [month, month, month], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
};

exports.getStudentReport = (req, res) => {
    db.query(
        `SELECT u.id, u.fullname, u.student_id, u.program, u.year_section, u.room_number,
                (SELECT COUNT(*) FROM attendance_logs WHERE user_id = u.id) AS total_attendance,
                (SELECT COUNT(*) FROM demerits WHERE user_id = u.id) AS total_demerits,
                (SELECT COALESCE(SUM(points), 0) FROM demerits WHERE user_id = u.id) AS total_points,
                (SELECT COUNT(*) FROM gate_requests WHERE user_id = u.id) AS total_gate_requests
         FROM users u
         WHERE u.role = 'student'
         ORDER BY u.fullname`,
        (err, results) => {
            if (err) return res.status(500).json(err);
            res.json(results);
        }
    );
};
