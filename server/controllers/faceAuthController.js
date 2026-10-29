const FaceDescriptor = require("../models/FaceDescriptor");
const User = require("../models/User");

exports.getStatus = async (req, res) => {
    try {
        const registered = Boolean(await FaceDescriptor.exists({ user_id: req.user.id }));
        res.json({ registered, face_registered: registered });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.register = async (req, res) => {
    const userId = req.user.id;
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
        return res.status(400).json({ message: "Valid face descriptor is required" });
    }

    try {
        const existing = await FaceDescriptor.exists({ user_id: userId });
        await FaceDescriptor.findOneAndUpdate(
            { user_id: userId },
            { descriptor: JSON.stringify(descriptor) },
            { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
        );
        await User.findByIdAndUpdate(userId, { fingerprint_registered: true });
        res.json({ message: existing ? "Face descriptor updated successfully" : "Face registered successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.verify = async (req, res) => {
    const userId = req.user.id;
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
        return res.status(400).json({ message: "Valid face descriptor is required" });
    }

    try {
        const stored = await FaceDescriptor.findOne({ user_id: userId });
        if (!stored) {
            return res.status(400).json({ message: "No face registered. Please register your face first.", verified: false });
        }

        const storedDescriptor = JSON.parse(stored.descriptor);
        const distance = computeEuclideanDistance(descriptor, storedDescriptor);
        const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.5");
        const verified = distance < threshold;
        if (verified) return res.json({ message: "Face verified successfully", verified: true, distance });
        res.status(401).json({ message: "Face does not match", verified: false, distance });
    } catch (error) {
        res.status(500).json({ message: error.message });
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
