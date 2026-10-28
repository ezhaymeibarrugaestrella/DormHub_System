const bcrypt = require("bcryptjs");
const User = require("../models/User");
const GateRequest = require("../models/GateRequest");
const WebauthnCredential = require("../models/WebauthnCredential");
const { serializeUser } = require("../utils/serialize");
const { isDevMode, issueVerificationToken } = require("../services/verification");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(serializeUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateProfile = async (req, res) => {
    const { fullname, email, program, year_section } = req.body;
    let user;
    let previousEmail;
    let previousEmailVerified;
    let emailChanged = false;
    try {
        user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : undefined;
        emailChanged = normalizedEmail !== undefined && normalizedEmail !== user.email;
        if (emailChanged) {
            const duplicate = await User.exists({ email: normalizedEmail, _id: { $ne: user._id } });
            if (duplicate) return res.status(409).json({ message: "An account with this email already exists" });
            previousEmail = user.email;
            previousEmailVerified = user.email_verified;
        }

        if (fullname !== undefined) user.fullname = fullname;
        if (program !== undefined) user.program = program || undefined;
        if (year_section !== undefined) user.year_section = year_section || undefined;
        if (emailChanged) {
            user.email = normalizedEmail;
            user.email_verified = false;
        }
        await user.save();

        if (!emailChanged) return res.json({ message: "Profile updated" });

        const verification = await issueVerificationToken(user);
        res.json({
            message: "Profile updated. Verify your new email address before signing in again.",
            requires_verification: true,
            ...(isDevMode() && verification.link ? { dev_link: verification.link } : {})
        });
    } catch (error) {
        if (user && emailChanged) {
            user.email = previousEmail;
            user.email_verified = previousEmailVerified;
            await user.save().catch(() => {});
        }
        if (error.code === "EMAIL_DELIVERY_NOT_CONFIGURED") {
            return res.status(503).json({ message: "Email verification is temporarily unavailable" });
        }
        if (error.code === 11000) return res.status(409).json({ message: "An account with this email already exists" });
        res.status(500).json({ message: error.message });
    }
};

exports.changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current and new password are required" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ message: "User not found" });

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ message: "Current password is incorrect" });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSystemInfo = async (req, res) => {
    try {
        const [totalUsers, totalGateRequests, totalBiometricRegistrations] = await Promise.all([
            User.countDocuments(),
            GateRequest.countDocuments(),
            WebauthnCredential.countDocuments()
        ]);
        res.json({ totalUsers, totalGateRequests, totalBiometricRegistrations, serverTime: new Date().toISOString() });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
