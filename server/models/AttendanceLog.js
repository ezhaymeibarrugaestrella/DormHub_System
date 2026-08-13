const mongoose = require("mongoose");

const attendanceLogSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: String },
        time_in: String,
        time_out: String,
        status: {
            type: String,
            enum: ["present", "absent", "late", "excused"],
            default: "present"
        },
        remarks: String,
        marked_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        location_lat: Number,
        location_lng: Number,
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        collection: "attendance_logs"
    }
);

module.exports = mongoose.model("AttendanceLog", attendanceLogSchema);
