const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const { hashToken, isDevMode, issueVerificationToken } = require("../services/verification");
const { EMAIL_VERIFICATION_ENABLED } = require("../config/featureFlags");

const INVALID_LOGIN_MESSAGE = "Invalid email or password";

function registrationToken(user) {
    return jwt.sign(
        { id: user.id, role: user.role, scope: "registration" },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
}

exports.register = async (req, res) => {
    let user;
    try {
        const { student_id, fullname, password } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

        if (!password || password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user = await User.create({
            student_id,
            fullname,
            email,
            password: hashedPassword,
            role: "student",
            registration_status: "pending",
            email_verified: !EMAIL_VERIFICATION_ENABLED
        });
        const verification = EMAIL_VERIFICATION_ENABLED ? await issueVerificationToken(user) : null;
        res.status(201).json({
            message: EMAIL_VERIFICATION_ENABLED
                ? "Registration submitted. Verify your email and wait for account approval."
                : "Registration submitted. Wait for account approval.",
            id: user.id,
            token: registrationToken(user),
            ...(EMAIL_VERIFICATION_ENABLED ? {
                verification: {
                    required: true,
                    ...(isDevMode() && verification.link ? { dev_link: verification.link } : {})
                }
            } : {})
        });
    } catch (error) {
        if (user) {
            await Promise.all([
                User.deleteOne({ _id: user._id }),
                EmailVerificationToken.deleteMany({ user_id: user._id, used_at: null })
            ]).catch(() => {});
        }
        if (error.code === 11000) return res.status(409).json({ message: "An account with this email or student ID already exists" });
        if (error.code === "EMAIL_DELIVERY_NOT_CONFIGURED") {
            return res.status(503).json({ message: "Email verification is temporarily unavailable" });
        }
        res.status(error.code === 11000 ? 409 : 500).json({ message: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { password } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
        const user = await User.findOne({ email });
        const validPassword = user && password
            ? await bcrypt.compare(password, user.password)
            : false;
        if (!validPassword) return res.status(401).json({ message: INVALID_LOGIN_MESSAGE });

        if (EMAIL_VERIFICATION_ENABLED && user.email_verified === false) {
            return res.status(403).json({
                message: "Please verify your email before signing in.",
                requires_verification: true
            });
        }

        if (user.registration_status === "pending") {
            return res.status(403).json({ message: "Your registration is pending approval from the landlady. Please wait for confirmation." });
        }
        if (user.registration_status === "rejected") {
            return res.status(403).json({ message: "Your registration was rejected. Please contact the landlady for more information." });
        }

        const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1d" });
        res.status(200).json({
            message: "Login Successful",
            token,
            user: {
                id: user.id,
                fullname: user.fullname,
                email: user.email,
                role: user.role,
                fingerprint_registered: Boolean(user.fingerprint_registered),
                registration_status: user.registration_status || null
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verifyEmail = async (req, res) => {
    if (!EMAIL_VERIFICATION_ENABLED) {
        return res.status(404).json({ message: "Email verification is disabled" });
    }

    const rawToken = req.body.token;
    if (typeof rawToken !== "string" || !/^[a-f0-9]{64}$/i.test(rawToken)) {
        return res.status(400).json({ message: "Verification link is invalid or has expired." });
    }

    try {
        const now = new Date();
        const verification = await EmailVerificationToken.findOneAndUpdate(
            {
                token_hash: hashToken(rawToken),
                used_at: null,
                expires_at: { $gt: now }
            },
            { $set: { used_at: now } },
            { new: true }
        );
        if (!verification) {
            return res.status(400).json({ message: "Verification link is invalid or has expired." });
        }

        const user = await User.findOneAndUpdate(
            { _id: verification.user_id, email: verification.email },
            { $set: { email_verified: true } },
            { new: true }
        );
        if (!user) {
            return res.status(400).json({ message: "Verification link is invalid or has expired." });
        }
        res.json({ message: "Email verified successfully. Your account still requires approval." });
    } catch (error) {
        res.status(500).json({ message: "Email verification failed" });
    }
};

exports.resendVerification = async (req, res) => {
    if (!EMAIL_VERIFICATION_ENABLED) {
        return res.status(404).json({ message: "Email verification is disabled" });
    }

    const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
    if (!email) return res.status(400).json({ message: "Email is required" });

    try {
        const user = await User.findOne({ email });
        if (!user || user.email_verified) {
            return res.json({ message: "If the account needs verification, a new link has been sent." });
        }

        const verification = await issueVerificationToken(user);
        res.json({
            message: "If the account needs verification, a new link has been sent.",
            ...(isDevMode() && verification.link ? { dev_link: verification.link } : {})
        });
    } catch (error) {
        if (error.code === "EMAIL_DELIVERY_NOT_CONFIGURED") {
            return res.status(503).json({ message: "Email verification is temporarily unavailable" });
        }
        res.status(500).json({ message: "Could not resend verification email" });
    }
};
