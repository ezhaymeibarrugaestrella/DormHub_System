const mongoose = require("mongoose");

const demeritSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        violation: String,
        points: { type: Number, default: 1 },
        remarks: String,
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        collection: "demerits"
    }
);

module.exports = mongoose.model("Demerit", demeritSchema);
