const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        student_id: { type: String, unique: true, sparse: true },
        fullname: String,
        email: { type: String, unique: true, sparse: true },
        password: String,
        role: { type: String, enum: ["superadmin", "staff", "student"], default: "student" },
        program: String,
        year_section: String,
        room_number: String,
        fingerprint_id: String,
        profile_picture: String,
        status: { type: String, enum: ["active", "inactive"], default: "active" },
        fingerprint_registered: { type: Boolean, default: false },
        address: String,
        parent_name: String,
        parent_contact: String,
        parent_address: String,
        registration_status: String,
        registration_remarks: String,
        email_verified: { type: Boolean, default: true },
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        collection: "users"
    }
);

module.exports = mongoose.model("User", userSchema);
