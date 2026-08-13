const AttendanceLog = require("../models/AttendanceLog");
const Demerit = require("../models/Demerit");
const GateRequest = require("../models/GateRequest");
const User = require("../models/User");
const { serializeAttendanceLog, serializeDemerit, serializeGateRequest } = require("../utils/serialize");

function dateRangeFilter(start, end) {
    if (!start || !end) return {};
    return {
        created_at: {
            $gte: new Date(`${start}T00:00:00.000Z`),
            $lte: new Date(`${end}T23:59:59.999Z`)
        }
    };
}

exports.getAttendanceReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        const filter = dateRangeFilter(start, end);

        const results = await AttendanceLog.find(filter)
            .populate("user_id", "fullname student_id program year_section")
            .sort({ created_at: -1 });

        res.json(results.map(serializeAttendanceLog));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getDemeritReport = async (req, res) => {
    try {
        const { start, end } = req.query;
        const filter = dateRangeFilter(start, end);

        const results = await Demerit.find(filter)
            .populate("user_id", "fullname student_id program")
            .sort({ created_at: -1 });

        res.json(results.map(serializeDemerit));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getGateRequestReport = async (req, res) => {
    try {
        const { start, end, status } = req.query;
        const filter = dateRangeFilter(start, end);

        if (status) {
            filter.status = status;
        }

        const results = await GateRequest.find(filter)
            .populate("user_id", "fullname student_id room_number")
            .sort({ created_at: -1 });

        res.json(results.map(serializeGateRequest));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getReportSummary = async (req, res) => {
    try {
        const { start, end } = req.query;
        const filter = dateRangeFilter(start, end);

        const [totalAttendance, totalDemerits, totalGateRequests, pendingRequests, approvedRequests] =
            await Promise.all([
                AttendanceLog.countDocuments(filter),
                Demerit.countDocuments(filter),
                GateRequest.countDocuments(filter),
                GateRequest.countDocuments({ ...filter, status: "pending" }),
                GateRequest.countDocuments({ ...filter, status: "approved" })
            ]);

        res.json({
            totalAttendance,
            totalDemerits,
            totalGateRequests,
            pendingRequests,
            approvedRequests
        });
    } catch (error) {
        console.error(error);
        res.status(500).json(error);
    }
};

exports.getMonthlyReport = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ error: "Month parameter required (YYYY-MM)" });
        }

        const results = await User.aggregate([
            { $match: { role: "student" } },
            {
                $lookup: {
                    from: "demerits",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "demerits"
                }
            },
            {
                $lookup: {
                    from: "gate_requests",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "gate_requests"
                }
            },
            {
                $project: {
                    fullname: 1,
                    student_id: 1,
                    program: 1,
                    year_section: 1,
                    room_number: 1,
                    total_demerit_points: {
                        $reduce: {
                            input: {
                                $filter: {
                                    input: "$demerits",
                                    as: "d",
                                    cond: {
                                        $regexMatch: {
                                            input: {
                                                $dateToString: { format: "%Y-%m", date: "$$d.created_at" }
                                            },
                                            regex: month
                                        }
                                    }
                                }
                            },
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.points", 0] }] }
                        }
                    },
                    total_going_out: {
                        $size: {
                            $filter: {
                                input: "$gate_requests",
                                as: "g",
                                cond: {
                                    $and: [
                                        { $eq: ["$$g.request_type", "out"] },
                                        { $eq: ["$$g.status", "approved"] },
                                        {
                                            $regexMatch: {
                                                input: {
                                                    $dateToString: { format: "%Y-%m", date: "$$g.created_at" }
                                                },
                                                regex: month
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    },
                    total_coming_in: {
                        $size: {
                            $filter: {
                                input: "$gate_requests",
                                as: "g",
                                cond: {
                                    $and: [
                                        { $eq: ["$$g.request_type", "in"] },
                                        { $eq: ["$$g.status", "approved"] },
                                        {
                                            $regexMatch: {
                                                input: {
                                                    $dateToString: { format: "%Y-%m", date: "$$g.created_at" }
                                                },
                                                regex: month
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    id: { $toString: "$_id" },
                    fullname: 1,
                    student_id: 1,
                    program: 1,
                    year_section: 1,
                    room_number: 1,
                    total_demerit_points: 1,
                    total_going_out: 1,
                    total_coming_in: 1
                }
            },
            { $sort: { fullname: 1 } }
        ]);

        res.json(results);
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getStudentReport = async (req, res) => {
    try {
        const results = await User.aggregate([
            { $match: { role: "student" } },
            {
                $lookup: {
                    from: "attendance_logs",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "attendance"
                }
            },
            {
                $lookup: {
                    from: "demerits",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "demerits"
                }
            },
            {
                $lookup: {
                    from: "gate_requests",
                    localField: "_id",
                    foreignField: "user_id",
                    as: "gate_requests"
                }
            },
            {
                $project: {
                    fullname: 1,
                    student_id: 1,
                    program: 1,
                    year_section: 1,
                    room_number: 1,
                    total_attendance: { $size: "$attendance" },
                    total_demerits: { $size: "$demerits" },
                    total_points: {
                        $reduce: {
                            input: "$demerits",
                            initialValue: 0,
                            in: { $add: ["$$value", { $ifNull: ["$$this.points", 0] }] }
                        }
                    },
                    total_gate_requests: { $size: "$gate_requests" }
                }
            },
            {
                $project: {
                    _id: 0,
                    id: { $toString: "$_id" },
                    fullname: 1,
                    student_id: 1,
                    program: 1,
                    year_section: 1,
                    room_number: 1,
                    total_attendance: 1,
                    total_demerits: 1,
                    total_points: 1,
                    total_gate_requests: 1
                }
            },
            { $sort: { fullname: 1 } }
        ]);

        res.json(results);
    } catch (error) {
        res.status(500).json(error);
    }
};
