const AttendanceLog = require("../models/AttendanceLog");
const NightlyAttendance = require("../models/NightlyAttendance");
const User = require("../models/User");
const { serializeUser, serializeAttendanceLog } = require("../utils/serialize");

exports.getAll = async (req, res) => {
    try {
        const { date, student_id, status } = req.query;

        const pipeline = [
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "u"
                }
            },
            { $unwind: { path: "$u", preserveNullAndEmptyArrays: false } },
            {
                $lookup: {
                    from: "users",
                    localField: "marked_by",
                    foreignField: "_id",
                    as: "m"
                }
            },
            { $unwind: { path: "$m", preserveNullAndEmptyArrays: true } }
        ];

        if (date) pipeline.push({ $match: { date } });
        if (status) pipeline.push({ $match: { status } });
        if (student_id) {
            pipeline.push({
                $match: { "u.student_id": { $regex: student_id, $options: "i" } }
            });
        }

        pipeline.push({ $sort: { date: -1, time_in: -1 } });

        const results = await AttendanceLog.aggregate(pipeline);

        res.json(
            results.map((r) => ({
                id: r._id.toString(),
                user_id: r.user_id,
                fullname: r.u.fullname,
                student_id: r.u.student_id,
                program: r.u.program,
                year_section: r.u.year_section,
                date: r.date,
                time_in: r.time_in || null,
                time_out: r.time_out || null,
                status: r.status,
                remarks: r.remarks || null,
                marked_by: r.marked_by ? r.marked_by.toString() : null,
                marked_by_name: r.m && r.m.fullname ? r.m.fullname : null,
                location_lat: r.location_lat || null,
                location_lng: r.location_lng || null,
                created_at: r.created_at
            }))
        );
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getToday = async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];

        const results = await AttendanceLog.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "u"
                }
            },
            { $unwind: { path: "$u", preserveNullAndEmptyArrays: false } },
            { $match: { date: today } },
            { $sort: { time_in: -1 } }
        ]);

        res.json(
            results.map((r) => ({
                id: r._id.toString(),
                user_id: r.user_id,
                fullname: r.u.fullname,
                student_id: r.u.student_id,
                program: r.u.program,
                year_section: r.u.year_section,
                date: r.date,
                time_in: r.time_in || null,
                time_out: r.time_out || null,
                status: r.status,
                remarks: r.remarks || null,
                location_lat: r.location_lat || null,
                location_lng: r.location_lng || null,
                created_at: r.created_at
            }))
        );
    } catch (error) {
        res.status(500).json(error);
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
        const existing = await AttendanceLog.findOne({ user_id, date });
        if (existing) {
            return res.status(409).json({ message: "Attendance already marked for this student on this date" });
        }

        const record = await AttendanceLog.create({
            user_id,
            date,
            time_in: time_in || null,
            time_out: time_out || null,
            status: status || "present",
            remarks: remarks || null,
            marked_by: req.user.id
        });

        res.status(201).json({ message: "Attendance marked successfully", id: record.id });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getStudents = async (req, res) => {
    try {
        const results = await User.find({ role: "student" }).sort({ fullname: 1 });
        res.json(results.map(serializeUser));
    } catch (error) {
        res.status(500).json(error);
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
    try {
        const userId = req.user.id;
        const nightlyDate = getNightlyDate();
        const { locationLat, locationLng } = req.body;

        const existing = await NightlyAttendance.findOne({ user_id: userId, date: nightlyDate });
        if (existing) {
            return res.status(409).json({ message: "Already checked in for tonight" });
        }

        await NightlyAttendance.create({
            user_id: userId,
            date: nightlyDate,
            status: "checked_in",
            checked_at: new Date(),
            location_lat: locationLat || null,
            location_lng: locationLng || null
        });

        res.status(201).json({ message: "Nightly check-in successful" });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getNightlyAttendance = async (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can view nightly attendance" });
    }

    try {
        const nightlyDate = req.query.date || getNightlyDate();

        const students = await User.aggregate([
            { $match: { role: "student" } },
            {
                $lookup: {
                    from: "nightly_attendance",
                    let: { uid: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$user_id", "$$uid"] },
                                        { $eq: ["$date", nightlyDate] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "nightly"
                }
            },
            {
                $project: {
                    fullname: 1,
                    student_id: 1,
                    program: 1,
                    year_section: 1,
                    nightly: { $arrayElemAt: ["$nightly", 0] }
                }
            },
            { $sort: { fullname: 1 } }
        ]);

        const checkedCount = students.filter(
            (s) => s.nightly && s.nightly.status === "checked_in"
        ).length;

        res.json({
            date: nightlyDate,
            total: students.length,
            checkedIn: checkedCount,
            students: students.map((s) => ({
                id: s._id.toString(),
                fullname: s.fullname,
                student_id: s.student_id,
                program: s.program,
                year_section: s.year_section,
                status: s.nightly ? s.nightly.status : "pending",
                checked_at: s.nightly ? s.nightly.checked_at : null,
                location_lat: s.nightly && s.nightly.location_lat != null ? s.nightly.location_lat : null,
                location_lng: s.nightly && s.nightly.location_lng != null ? s.nightly.location_lng : null
            }))
        });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getStudentNightlyStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const nightlyDate = getNightlyDate();

        const record = await NightlyAttendance.findOne({ user_id: userId, date: nightlyDate });

        if (record) {
            res.json({
                checkedIn: true,
                status: record.status,
                checkedAt: record.checked_at,
                date: record.date
            });
        } else {
            res.json({ checkedIn: false, status: "pending", date: nightlyDate });
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.updateAttendance = async (req, res) => {
    const role = req.user.role;
    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can update attendance" });
    }

    try {
        const { id } = req.params;
        const { time_in, time_out, status, remarks } = req.body;

        const update = {};
        if (time_in) update.time_in = time_in;
        if (time_out) update.time_out = time_out;
        if (status) update.status = status;
        if (remarks) update.remarks = remarks;

        const result = await AttendanceLog.findByIdAndUpdate(id, update, { new: true });

        if (!result) {
            return res.status(404).json({ message: "Attendance record not found" });
        }

        res.json({ message: "Attendance updated successfully" });
    } catch (error) {
        res.status(500).json(error);
    }
};
