const GateRequest = require("../models/GateRequest");
const { serializeGateRequest } = require("../utils/serialize");

exports.getAll = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    try {
        const filter = role === "superadmin" || role === "staff" ? {} : { user_id: userId };
        const results = await GateRequest.find(filter)
            .populate("user_id", "fullname student_id room_number")
            .populate("approved_by", "fullname")
            .sort({ created_at: -1 });
        res.json(results.map(serializeGateRequest));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getPendingCount = async (req, res) => {
    try {
        const count = await GateRequest.countDocuments({ status: "pending" });
        res.json({ count });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRecent = async (req, res) => {
    try {
        const results = await GateRequest.find()
            .populate("user_id", "fullname student_id")
            .populate("approved_by", "fullname")
            .sort({ created_at: -1 })
            .limit(5);
        res.json(results.map(serializeGateRequest));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.create = async (req, res) => {
    const userId = req.user.id;
    const { requestType, locationLat, locationLng } = req.body;

    if (!requestType || !["in", "out"].includes(requestType)) {
        return res.status(400).json({ message: "Valid request type required (in/out)" });
    }

    try {
        const request = await GateRequest.create({
            user_id: userId,
            request_type: requestType,
            location_lat: locationLat,
            location_lng: locationLng,
            fingerprint_verified: true
        });
        res.status(201).json({ message: "Gate request submitted successfully", id: request.id });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.update = async (req, res) => {
    const userId = req.user.id;
    const role = req.user.role;
    const { id } = req.params;
    const { status, remarks } = req.body;

    if (role !== "superadmin" && role !== "staff") {
        return res.status(403).json({ message: "Only administrators can approve/reject requests" });
    }

    if (!["approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status must be 'approved' or 'rejected'" });
    }

    try {
        const request = await GateRequest.findByIdAndUpdate(
            id,
            { status, remarks: remarks || undefined, approved_by: userId },
            { runValidators: true }
        );
        if (!request) return res.status(404).json({ message: "Gate request not found" });
        res.json({ message: `Request ${status} successfully` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
