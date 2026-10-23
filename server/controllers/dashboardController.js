const db = require("../config/db");

exports.getDashboardStats = (req, res) => {
    const stats = {};

    db.query("SELECT COUNT(*) AS totalUsers FROM users", (err, users) => {
        stats.totalUsers = users[0].totalUsers;

        db.query("SELECT COUNT(*) AS totalAttendance FROM attendance_logs", (err, attendance) => {
            stats.totalAttendance = attendance[0].totalAttendance;

            db.query("SELECT COUNT(*) AS totalDemerits FROM demerits", (err, demerits) => {
                stats.totalDemerits = demerits[0].totalDemerits;

                db.query("SELECT COUNT(*) AS activeUsers FROM users WHERE status = 'active'", (err, active) => {
                    stats.activeUsers = active[0].activeUsers;
                    res.json(stats);
                });
            });
        });
    });
};