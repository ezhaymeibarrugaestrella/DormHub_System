const mongoose = require("mongoose");

const gateRequestSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        request_type: { type: String, enum: ["in", "out"], required: true },
        location_lat: Number,
        location_lng: Number,
        status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
        approved_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        remarks: String,
        fingerprint_verified: { type: Boolean, default: false },
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        collection: "gate_requests"
    }
);

module.exports = mongoose.model("GateRequest", gateRequestSchema);
