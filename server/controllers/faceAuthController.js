const FaceDescriptor = require("../models/FaceDescriptor");
const User = require("../models/User");

exports.getStatus = async (req, res) => {
    try {
        const count = await FaceDescriptor.countDocuments({ user_id: req.user.id });
        res.json({ registered: count > 0, face_registered: count > 0 });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.register = async (req, res) => {
    try {
        const userId = req.user.id;
        const { descriptor } = req.body;

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
            return res.status(400).json({ message: "Valid face descriptor is required" });
        }

        const descriptorJson = JSON.stringify(descriptor);

        const existing = await FaceDescriptor.findOne({ user_id: userId });

        if (existing) {
            existing.descriptor = descriptorJson;
            await existing.save();
            return res.json({ message: "Face descriptor updated successfully" });
        }

        await FaceDescriptor.create({ user_id: userId, descriptor: descriptorJson });
        await User.findByIdAndUpdate(userId, { fingerprint_registered: true });

        res.json({ message: "Face registered successfully" });
    } catch (error) {
        res.status(500).json(error);
    }
};

exports.verify = async (req, res) => {
    try {
        const userId = req.user.id;
        const { descriptor } = req.body;

        if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
            return res.status(400).json({ message: "Valid face descriptor is required" });
        }

        const record = await FaceDescriptor.findOne({ user_id: userId });

        if (!record) {
            return res.status(400).json({ message: "No face registered. Please register your face first.", verified: false });
        }

        const storedDescriptor = JSON.parse(record.descriptor);

        const distance = computeEuclideanDistance(descriptor, storedDescriptor);
        const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.5");
        const verified = distance < threshold;

        if (verified) {
            res.json({ message: "Face verified successfully", verified: true, distance });
        } else {
            res.status(401).json({ message: "Face does not match", verified: false, distance });
        }
    } catch (error) {
        res.status(500).json(error);
    }
};

function computeEuclideanDistance(a, b) {
    if (a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}
