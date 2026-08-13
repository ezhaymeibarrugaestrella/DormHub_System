const Demerit = require("../models/Demerit");
const { serializeDemerit } = require("../utils/serialize");

exports.getAll = async (req, res) => {
    try {
        const results = await Demerit.find()
            .populate("user_id", "fullname student_id room_number")
            .sort({ created_at: -1 });

        res.json(results.map(serializeDemerit));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getByUser = async (req, res) => {
    try {
        const results = await Demerit.find({ user_id: req.user.id }).sort({ created_at: -1 });
        res.json(results.map(serializeDemerit));
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.getSummary = async (req, res) => {
    try {
        const results = await Demerit.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: "user_id",
                    foreignField: "_id",
                    as: "u"
                }
            },
            { $unwind: "$u" },
            { $match: { "u.role": "student" } },
            {
                $group: {
                    _id: "$u._id",
                    fullname: { $first: "$u.fullname" },
                    student_id: { $first: "$u.student_id" },
                    total_demerits: { $sum: 1 },
                    total_points: { $sum: "$points" }
                }
            },
            {
                $project: {
                    _id: 0,
                    id: { $toString: "$_id" },
                    fullname: 1,
                    student_id: 1,
                    total_demerits: 1,
                    total_points: 1
                }
            },
            { $sort: { total_points: -1 } }
        ]);

        res.json(results);
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.create = async (req, res) => {
    try {
        const { user_id, violation, points } = req.body;

        if (!user_id || !violation) {
            return res.status(400).json({ message: "User ID and violation are required" });
        }

        const demerit = await Demerit.create({
            user_id,
            violation,
            points: points || 1
        });

        res.status(201).json({ message: "Demerit added", id: demerit.id });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.remove = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await Demerit.findByIdAndDelete(id);

        if (!result) {
            return res.status(404).json({ message: "Demerit not found" });
        }

        res.json({ message: "Demerit removed" });
    } catch (error) {
        res.status(500).json(error);
    }
};
