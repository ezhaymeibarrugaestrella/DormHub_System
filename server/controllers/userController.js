const User = require("../models/User");
const { serializeUser } = require("../utils/serialize");
const bcrypt = require("bcryptjs");

exports.getAll = async (req, res) => {
    try {
        const results = await User.find().sort({ fullname: 1 });
        res.json(results.map(serializeUser));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(serializeUser(user));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.update = async (req, res) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can update users" });
    }

    try {
        const {
            fullname,
            email,
            role,
            program,
            year_section,
            room_number,
            address,
            parent_name,
            parent_contact,
            parent_address,
            status,
            password
        } = req.body;

        const userId = req.params.id;

        const update = {
            fullname,
            email,
            program: program || null,
            year_section: year_section || null,
            room_number: room_number || null,
            address: address || null,
            parent_name: parent_name || null,
            parent_contact: parent_contact || null,
            parent_address: parent_address || null
        };

        if (role) update.role = role;
        if (status) update.status = status;
        if (password) {
            update.password = await bcrypt.hash(password, 10);
        }

        const result = await User.findByIdAndUpdate(userId, update, { new: true });

        if (!result) return res.status(404).json({ message: "User not found" });

        res.json({ message: "User updated successfully" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: "Email or Student ID already exists" });
        }
        res.status(500).json(error);
    }
};

exports.remove = async (req, res) => {
    if (req.user.role !== "superadmin") {
        return res.status(403).json({ message: "Only superadmin can delete users" });
    }

    try {
        const userId = req.params.id;

        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.role === "superadmin") {
            return res.status(403).json({ message: "Cannot delete a superadmin account" });
        }

        await User.findByIdAndDelete(userId);

        res.json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json(error);
    }
};
