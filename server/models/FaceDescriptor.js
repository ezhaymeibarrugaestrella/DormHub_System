const mongoose = require("mongoose");

const faceDescriptorSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
        descriptor: { type: String, required: true },
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
        collection: "face_descriptors"
    }
);

module.exports = mongoose.model("FaceDescriptor", faceDescriptorSchema);
