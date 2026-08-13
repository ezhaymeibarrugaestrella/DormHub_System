const User = require("../models/User");
const GateRequest = require("../models/GateRequest");
const WebauthnCredential = require("../models/WebauthnCredential");
const { serializeUser } = require("../utils/serialize");
const bcrypt = require("bcryptjs");

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(serializeUser(user));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const { fullname, email, program, year_section } = req.body;

        await User.findByIdAndUpdate(
            req.user.id,
            {
                fullname,
                email,
                program: program || null,
                year_section: year_section || null
            }
        );

        res.json({ message: "Profile updated" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email already in use" });
        }
        res.status(500).json(error);
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

        const hashed = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(req.user.id, { password: hashed });

        res.json({ message: "Password changed successfully" });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getSystemInfo = async (req, res) => {
    try {
        const [totalUsers, totalGateRequests, totalBiometricRegistrations] = await Promise.all([
            User.countDocuments(),
            GateRequest.countDocuments(),
            WebauthnCredential.countDocuments()
        ]);

        res.json({
            totalUsers,
            totalGateRequests,
            totalBiometricRegistrations,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json(error);
    }
};
