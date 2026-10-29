const Demerit = require("../models/Demerit");
const User = require("../models/User");
const { serializeDemerit } = require("../utils/serialize");

exports.getAll = async (req, res) => {
    try {
        const results = await Demerit.find().populate("user_id", "fullname student_id room_number program").sort({ created_at: -1 });
        res.json(results.map(serializeDemerit));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getByUser = async (req, res) => {
    try {
        const results = await Demerit.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json(results.map(serializeDemerit));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getSummary = async (req, res) => {
    try {
        const [students, totals] = await Promise.all([
            User.find({ role: "student" }).select("fullname student_id"),
            Demerit.aggregate([
                { $group: { _id: "$user_id", total_demerits: { $sum: 1 }, total_points: { $sum: "$points" } } }
            ])
        ]);
        const totalsByUser = new Map(totals.map((entry) => [entry._id.toString(), entry]));
        const results = students.map((student) => {
            const total = totalsByUser.get(student.id) || {};
            return {
                id: student.id,
                fullname: student.fullname,
                student_id: student.student_id,
                total_demerits: total.total_demerits || 0,
                total_points: total.total_points || 0
            };
        });
        results.sort((first, second) => second.total_points - first.total_points);
        res.json(results);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    const { user_id, violation, points } = req.body;

    if (!user_id || !violation) {
        return res.status(400).json({ message: "User ID and violation are required" });
    }

    try {
        const demerit = await Demerit.create({ user_id, violation, points: points || 1 });
        res.status(201).json({ message: "Demerit added", id: demerit.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.remove = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Demerit.findByIdAndDelete(id);
        if (!result) return res.status(404).json({ message: "Demerit not found" });
        res.json({ message: "Demerit removed" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
