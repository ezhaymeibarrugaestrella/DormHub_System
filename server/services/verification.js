const crypto = require("crypto");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const { sendVerificationEmail, EMAIL_MODE } = require("./mailer");

const VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function hashToken(rawToken) {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
}

function isDevMode() {
    return EMAIL_MODE === "dev" && process.env.NODE_ENV !== "production";
}

async function issueVerificationToken(user, emailOverride) {
    const email = emailOverride || user.email;
    const raw = crypto.randomBytes(32).toString("hex");

    const verification = await EmailVerificationToken.create({
        user_id: user._id,
        email,
        token_hash: hashToken(raw),
        expires_at: new Date(Date.now() + VERIFICATION_TTL_MS)
    });

    let result;
    try {
        result = await sendVerificationEmail({ to: email, fullname: user.fullname, token: raw });
    } catch (error) {
        await verification.deleteOne();
        throw error;
    }

    await EmailVerificationToken.deleteMany({
        user_id: user._id,
        used_at: null,
        _id: { $ne: verification._id }
    });

    return result;
}

async function issueVerificationSafely(user, emailOverride) {
    try {
        return await issueVerificationToken(user, emailOverride);
    } catch (error) {
        console.error("[VERIFICATION] Failed to issue verification token:", error.message);
        return null;
    }
}

module.exports = {
    VERIFICATION_TTL_MS,
    hashToken,
    isDevMode,
    issueVerificationToken,
    issueVerificationSafely
};
