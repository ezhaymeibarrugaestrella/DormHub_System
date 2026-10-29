const bcrypt = require("bcryptjs");
const User = require("../models/User");
const GateRequest = require("../models/GateRequest");
const AttendanceLog = require("../models/AttendanceLog");
const Demerit = require("../models/Demerit");
const FaceDescriptor = require("../models/FaceDescriptor");
const NightlyAttendance = require("../models/NightlyAttendance");
const WebauthnCredential = require("../models/WebauthnCredential");
const { serializeUser } = require("../utils/serialize");

exports.getAll = async (req, res) => {
    try {
        const users = await User.find().sort({ fullname: 1 });
        res.json(users.map(serializeUser));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(serializeUser(user));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can update users" });
    }

    const { fullname, email, role, program, year_section, room_number, address, parent_name, parent_contact, parent_address, status, password } = req.body;
    const userId = req.params.id;

    try {
        const updates = {};
        for (const [field, value] of Object.entries({ fullname, email, role, program, year_section, room_number, address, parent_name, parent_contact, parent_address, status })) {
            if (value !== undefined) updates[field] = value || undefined;
        }
        if (password) updates.password = await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(userId, updates, { runValidators: true });
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json({ message: "User updated successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can delete users" });
    }

    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });
        if (user.role === "superadmin") {
            return res.status(403).json({ message: "Cannot delete a superadmin account" });
        }

        await Promise.all([
            GateRequest.deleteMany({ $or: [{ user_id: userId }, { approved_by: userId }] }),
            AttendanceLog.deleteMany({ $or: [{ user_id: userId }, { marked_by: userId }] }),
            Demerit.deleteMany({ user_id: userId }),
            FaceDescriptor.deleteMany({ user_id: userId }),
            NightlyAttendance.deleteMany({ user_id: userId }),
            WebauthnCredential.deleteMany({ user_id: userId })
        ]);
        await user.deleteOne();
        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
