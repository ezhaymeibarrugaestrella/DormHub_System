const AttendanceLog = require("../models/AttendanceLog");
const NightlyAttendance = require("../models/NightlyAttendance");
const User = require("../models/User");
const { serializeAttendanceLog } = require("../utils/serialize");

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

exports.getAll = async (req, res) => {
    const { date, student_id, status } = req.query;
    try {
        const filter = {};
        if (date) filter.date = date;
        if (status) filter.status = status;
        const query = AttendanceLog.find(filter)
            .populate("user_id", "fullname student_id program year_section")
            .populate("marked_by", "fullname")
            .sort({ date: -1, time_in: -1 });
        const results = await query;
        const matching = student_id
            ? results.filter((record) => record.user_id?.student_id?.match(new RegExp(escapeRegex(student_id), "i")))
            : results;
        res.json(matching.map(serializeAttendanceLog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getToday = async (req, res) => {
    const today = new Date().toISOString().split("T")[0];
    try {
        const results = await AttendanceLog.find({ date: today })
            .populate("user_id", "fullname student_id program year_section")
            .sort({ time_in: -1 });
        res.json(results.map(serializeAttendanceLog));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.markAttendance = async (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can mark attendance" });
    }

    const { user_id, date, time_in, time_out, status, remarks } = req.body;

    if (!user_id || !date) {
        return res.status(400).json({ message: "User ID and date are required" });
    }

    try {
        const record = await AttendanceLog.create({
            user_id,
            date,
            time_in: time_in || undefined,
            time_out: time_out || undefined,
            status: status || "present",
            remarks: remarks || undefined,
            marked_by: req.user.id
        });
        res.status(201).json({ message: "Attendance marked successfully", id: record.id });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Attendance already marked for this student on this date" });
        }
        res.status(500).json({ message: error.message });
    }
};

exports.getStudents = async (req, res) => {
    try {
        const students = await User.find({ role: "student" })
            .select("fullname student_id program year_section")
            .sort({ fullname: 1 });
        res.json(students.map((student) => ({ id: student.id, ...student.toObject() })));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
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

exports.nightlyCheckIn = async (req, res) => {
    const userId = req.user.id;
    const nightlyDate = getNightlyDate();
    const { locationLat, locationLng } = req.body;

    try {
        await NightlyAttendance.create({
            user_id: userId,
            date: nightlyDate,
            status: "checked_in",
            checked_at: new Date(),
            location_lat: locationLat,
            location_lng: locationLng
        });
        res.status(201).json({ message: "Nightly check-in successful" });
    } catch (error) {
        if (error.code === 11000) return res.status(409).json({ message: "Already checked in for tonight" });
        res.status(500).json({ message: error.message });
    }
};

exports.getNightlyAttendance = async (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can view nightly attendance" });
    }

    const nightlyDate = req.query.date || getNightlyDate();

    try {
        const students = await User.find({ role: "student" })
            .select("fullname student_id program year_section")
            .sort({ fullname: 1 });
        const records = await NightlyAttendance.find({ date: nightlyDate, user_id: { $in: students.map((student) => student._id) } });
        const recordsByUser = new Map(records.map((record) => [record.user_id.toString(), record]));
        const results = students.map((student) => {
            const record = recordsByUser.get(student.id);
            return {
                id: student.id,
                ...student.toObject(),
                status: record?.status || null,
                checked_at: record?.checked_at || null,
                location_lat: record?.location_lat ?? null,
                location_lng: record?.location_lng ?? null
            };
        });
        const checkedCount = results.filter((student) => student.status === "checked_in").length;
        res.json({ date: nightlyDate, total: results.length, checkedIn: checkedCount, students: results });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getStudentNightlyStatus = async (req, res) => {
    const userId = req.user.id;
    const nightlyDate = getNightlyDate();

    try {
        const record = await NightlyAttendance.findOne({ user_id: userId, date: nightlyDate });
        if (record) return res.json({ checkedIn: true, status: record.status, checkedAt: record.checked_at, date: record.date });
        res.json({ checkedIn: false, status: "pending", date: nightlyDate });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateAttendance = async (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can update attendance" });
    }

    const { id } = req.params;
    const { time_in, time_out, status, remarks } = req.body;

    try {
        const updates = {};
        for (const [field, value] of Object.entries({ time_in, time_out, status, remarks })) {
            if (value !== undefined && value !== null && value !== "") updates[field] = value;
        }
        const record = await AttendanceLog.findByIdAndUpdate(id, updates, { runValidators: true });
        if (!record) return res.status(404).json({ message: "Attendance record not found" });
        res.json({ message: "Attendance updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
