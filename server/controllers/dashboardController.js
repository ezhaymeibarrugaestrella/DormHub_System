const User = require("../models/User");
const AttendanceLog = require("../models/AttendanceLog");
const Demerit = require("../models/Demerit");

exports.getDashboardStats = async (req, res) => {
    try {
        const [totalUsers, totalAttendance, totalDemerits, activeUsers] = await Promise.all([
            User.countDocuments(),
            AttendanceLog.countDocuments(),
            Demerit.countDocuments(),
            User.countDocuments({ status: "active" })
        ]);

        res.json({ totalUsers, totalAttendance, totalDemerits, activeUsers });
    } catch (error) {
        res.status(500).json(error);
    }
};
