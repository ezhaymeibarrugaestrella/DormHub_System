const User = require("../models/User");
const { serializeUser } = require("../utils/serialize");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const STATUS_ORDER = { pending: 0, approved: 1, rejected: 2 };

exports.register = async (req, res) => {
    try {
        const {
            student_id,
            fullname,
            email,
            password,
            program,
            year_section,
            room_number,
            address,
            parent_name,
            parent_contact,
            parent_address
        } = req.body;

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            student_id,
            fullname,
            email,
            password: hashedPassword,
            role: "student",
            program: program || null,
            year_section: year_section || null,
            room_number: room_number || null,
            address: address || null,
            parent_name: parent_name || null,
            parent_contact: parent_contact || null,
            parent_address: parent_address || null,
            registration_status: "pending",
            status: "active"
        });

        const token = jwt.sign(
            { id: user.id, role: "student" },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.status(201).json({
            message: "Registration submitted. Please register your fingerprint.",
            token,
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
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email or Student ID already exists" });
        }
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

exports.getAll = async (req, res) => {
    const role = req.user.role;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Access denied" });
    }

    try {
        const results = await User.find({
            role: "student",
            registration_status: { $exists: true, $ne: null }
        });

        results.sort((a, b) => {
            const statusDiff =
                (STATUS_ORDER[a.registration_status] ?? 3) -
                (STATUS_ORDER[b.registration_status] ?? 3);
            if (statusDiff !== 0) return statusDiff;
            return new Date(b.created_at) - new Date(a.created_at);
        });

        res.json(results.map(serializeUser));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const count = await User.countDocuments({
            role: "student",
            registration_status: "pending"
        });
        res.json({ count });
    } catch (error) {
        res.status(500).json(error);
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
        const result = await User.findOneAndUpdate(
            { _id: id, role: "student" },
            { registration_status: status, registration_remarks: remarks || null },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ message: "Student not found" });
        }

        res.json({ message: `Registration ${status} successfully` });
    } catch (error) {
        res.status(500).json(error);
    }
};
