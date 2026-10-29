const mongoose = require("mongoose");

const emailVerificationTokenSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
        email: String,
        token_hash: { type: String, index: true },
        expires_at: Date,
        used_at: Date
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        collection: "email_verification_tokens"
    }
);

module.exports = mongoose.model("EmailVerificationToken", emailVerificationTokenSchema);
