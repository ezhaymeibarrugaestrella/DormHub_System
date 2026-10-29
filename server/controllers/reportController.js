const AttendanceLog = require("../models/AttendanceLog");
const Demerit = require("../models/Demerit");
const GateRequest = require("../models/GateRequest");
const User = require("../models/User");
const { serializeAttendanceLog, serializeDemerit, serializeGateRequest } = require("../utils/serialize");

function createdAtFilter(start, end) {
    if (!start || !end) return {};
    const endExclusive = new Date(`${end}T00:00:00.000Z`);
    endExclusive.setUTCDate(endExclusive.getUTCDate() + 1);
    return { created_at: { $gte: new Date(`${start}T00:00:00.000Z`), $lt: endExclusive } };
}

function monthRange(month) {
    const start = new Date(`${month}-01T00:00:00.000Z`);
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    return { $gte: start, $lt: end };
}

exports.getAttendanceReport = async (req, res) => {
    try {
        const results = await AttendanceLog.find(createdAtFilter(req.query.start, req.query.end))
            .populate("user_id", "fullname student_id program year_section")
            .sort({ created_at: -1 });
        res.json(results.map(serializeAttendanceLog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getDemeritReport = async (req, res) => {
    try {
        const results = await Demerit.find(createdAtFilter(req.query.start, req.query.end))
            .populate("user_id", "fullname student_id program")
            .sort({ created_at: -1 });
        res.json(results.map(serializeDemerit));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getGateRequestReport = async (req, res) => {
    try {
        const filter = { ...createdAtFilter(req.query.start, req.query.end) };
        if (req.query.status) filter.status = req.query.status;
        const results = await GateRequest.find(filter)
            .populate("user_id", "fullname student_id room_number")
            .sort({ created_at: -1 });
        res.json(results.map(serializeGateRequest));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getReportSummary = async (req, res) => {
    try {
        const dateFilter = createdAtFilter(req.query.start, req.query.end);
        const [totalAttendance, totalDemerits, totalGateRequests, pendingRequests, approvedRequests] = await Promise.all([
            AttendanceLog.countDocuments(dateFilter),
            Demerit.countDocuments(dateFilter),
            GateRequest.countDocuments(dateFilter),
            GateRequest.countDocuments({ ...dateFilter, status: "pending" }),
            GateRequest.countDocuments({ ...dateFilter, status: "approved" })
        ]);
        res.json({ totalAttendance, totalDemerits, totalGateRequests, pendingRequests, approvedRequests });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getMonthlyReport = async (req, res) => {
    const { month } = req.query;
    if (!month || !/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
        return res.status(400).json({ error: "Month parameter required (YYYY-MM)" });
    }

    try {
        const created_at = monthRange(month);
        const [students, demeritTotals, gateTotals] = await Promise.all([
            User.find({ role: "student" }).select("fullname student_id program year_section room_number").sort({ fullname: 1 }),
            Demerit.aggregate([
                { $match: { created_at } },
                { $group: { _id: "$user_id", total_demerit_points: { $sum: "$points" } } }
            ]),
            GateRequest.aggregate([
                { $match: { created_at, status: "approved", request_type: { $in: ["in", "out"] } } },
                { $group: { _id: { user_id: "$user_id", request_type: "$request_type" }, count: { $sum: 1 } } }
            ])
        ]);
        const pointsByUser = new Map(demeritTotals.map((entry) => [entry._id.toString(), entry.total_demerit_points]));
        const gatesByUser = new Map();
        for (const entry of gateTotals) {
            const userId = entry._id.user_id.toString();
            const counts = gatesByUser.get(userId) || { in: 0, out: 0 };
            counts[entry._id.request_type] = entry.count;
            gatesByUser.set(userId, counts);
        }
        res.json(students.map((student) => {
            const gates = gatesByUser.get(student.id) || { in: 0, out: 0 };
            return {
                id: student.id,
                ...student.toObject(),
                total_demerit_points: pointsByUser.get(student.id) || 0,
                total_going_out: gates.out,
                total_coming_in: gates.in
            };
        }));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentReport = async (req, res) => {
    try {
        const [students, attendanceTotals, demeritTotals, gateTotals] = await Promise.all([
            User.find({ role: "student" }).select("fullname student_id program year_section room_number").sort({ fullname: 1 }),
            AttendanceLog.aggregate([{ $group: { _id: "$user_id", total_attendance: { $sum: 1 } } }]),
            Demerit.aggregate([{ $group: { _id: "$user_id", total_demerits: { $sum: 1 }, total_points: { $sum: "$points" } } }]),
            GateRequest.aggregate([{ $group: { _id: "$user_id", total_gate_requests: { $sum: 1 } } }])
        ]);
        const asMap = (entries) => new Map(entries.map((entry) => [entry._id.toString(), entry]));
        const attendanceByUser = asMap(attendanceTotals);
        const demeritsByUser = asMap(demeritTotals);
        const gatesByUser = asMap(gateTotals);
        res.json(students.map((student) => {
            const id = student.id;
            return {
                id,
                ...student.toObject(),
                total_attendance: attendanceByUser.get(id)?.total_attendance || 0,
                total_demerits: demeritsByUser.get(id)?.total_demerits || 0,
                total_points: demeritsByUser.get(id)?.total_points || 0,
                total_gate_requests: gatesByUser.get(id)?.total_gate_requests || 0
            };
        }));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
