const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { serializeUser } = require("../utils/serialize");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const { isDevMode, issueVerificationToken } = require("../services/verification");

exports.register = async (req, res) => {
    let user;
    try {
        const {
            student_id,
            fullname,
            password,
            program,
            year_section,
            room_number,
            address,
            parent_name,
            parent_contact,
            parent_address
        } = req.body;
        const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";

        const hashedPassword = await bcrypt.hash(password, 10);

        user = await User.create({
            student_id,
            fullname,
            email,
            password: hashedPassword,
            role: "student",
            program,
            year_section,
            room_number,
            address,
            parent_name,
            parent_contact,
            parent_address,
            registration_status: "pending",
            status: "active",
            email_verified: false
        });
        const verification = await issueVerificationToken(user);
        const token = jwt.sign(
            { id: user.id, role: "student", scope: "registration" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        res.status(201).json({
            message: "Registration submitted. Verify your email and register your fingerprint.",
            token,
            verification: {
                required: true,
                ...(isDevMode() && verification.link ? { dev_link: verification.link } : {})
            },
            user: {
                id: user.id,
                fullname,
                email,
                role: "student",
                fingerprint_registered: false,
                registration_status: "pending"
            }
        });
    } catch (error) {
        if (user) {
            await Promise.all([
                User.deleteOne({ _id: user._id }),
                EmailVerificationToken.deleteMany({ user_id: user._id, used_at: null })
            ]).catch(() => {});
        }
        if (error.code === "EMAIL_DELIVERY_NOT_CONFIGURED") {
            return res.status(503).json({ message: "Email verification is temporarily unavailable" });
        }
        res.status(error.code === 11000 ? 409 : 500).json({ message: "Registration failed", error: error.message });
    }
};

exports.getAll = async (req, res) => {
    const role = req.user.role;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const students = await User.find({ role: "student", registration_status: { $ne: null } }).sort({ created_at: -1 });
        const statusOrder = { pending: 0, approved: 1, rejected: 2 };
        students.sort((first, second) => (statusOrder[first.registration_status] ?? 3) - (statusOrder[second.registration_status] ?? 3));
        res.json(students.map(serializeUser));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const count = await User.countDocuments({ role: "student", registration_status: "pending" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    const role = req.user.role;
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    try {
        const student = await User.findOneAndUpdate(
            { _id: id, role: "student" },
            { registration_status: status, registration_remarks: remarks || undefined },
            { runValidators: true }
        );
        if (!student) return res.status(404).json({ message: "Student not found" });
        res.json({ message: `Registration ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
