const mongoose = require("mongoose");

const nightlyAttendanceSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        date: { type: String },
        status: { type: String, enum: ["pending", "checked_in"], default: "pending" },
        checked_at: Date,
        location_lat: Number,
        location_lng: Number,
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        collection: "nightly_attendance"
    }
);

nightlyAttendanceSchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("NightlyAttendance", nightlyAttendanceSchema);
