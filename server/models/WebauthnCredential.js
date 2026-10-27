const mongoose = require("mongoose");

const webauthnCredentialSchema = new mongoose.Schema(
    {
        user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
        credential_id: { type: String, unique: true, sparse: true },
        public_key: String,
        counter: { type: Number, default: 0 },
        transports: String,
        legacy_id: Number
    },
    {
        timestamps: { createdAt: "created_at", updatedAt: false },
        collection: "webauthn_credentials"
    }
);

module.exports = mongoose.model("WebauthnCredential", webauthnCredentialSchema);
