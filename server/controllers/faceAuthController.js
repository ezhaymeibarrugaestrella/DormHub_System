const db = require("../config/db");

exports.getStatus = (req, res) => {
    db.query(
        "SELECT COUNT(*) AS count FROM face_descriptors WHERE user_id = ?",
        [req.user.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ registered: result[0].count > 0, face_registered: result[0].count > 0 });
        }
    );
};

exports.register = (req, res) => {
    const userId = req.user.id;
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
        return res.status(400).json({ message: "Valid face descriptor is required" });
    }

    db.query(
        "SELECT id FROM face_descriptors WHERE user_id = ?",
        [userId],
        (err, existing) => {
            if (err) return res.status(500).json(err);

            const descriptorJson = JSON.stringify(descriptor);

            if (existing.length > 0) {
                db.query(
                    "UPDATE face_descriptors SET descriptor = ? WHERE user_id = ?",
                    [descriptorJson, userId],
                    (err) => {
                        if (err) return res.status(500).json(err);
                        res.json({ message: "Face descriptor updated successfully" });
                    }
                );
            } else {
                db.query(
                    "INSERT INTO face_descriptors (user_id, descriptor) VALUES (?, ?)",
                    [userId, descriptorJson],
                    (err) => {
                        if (err) return res.status(500).json(err);
                        db.query(
                            "UPDATE users SET fingerprint_registered = 1 WHERE id = ?",
                            [userId]
                        );
                        res.json({ message: "Face registered successfully" });
                    }
                );
            }
        }
    );
};

exports.verify = (req, res) => {
    const userId = req.user.id;
    const { descriptor } = req.body;

    if (!descriptor || !Array.isArray(descriptor) || descriptor.length === 0) {
        return res.status(400).json({ message: "Valid face descriptor is required" });
    }

    db.query(
        "SELECT descriptor FROM face_descriptors WHERE user_id = ?",
        [userId],
        (err, rows) => {
            if (err) return res.status(500).json(err);
            if (rows.length === 0) {
                return res.status(400).json({ message: "No face registered. Please register your face first.", verified: false });
            }

            const storedDescriptor = JSON.parse(rows[0].descriptor);

            const distance = computeEuclideanDistance(descriptor, storedDescriptor);
            const threshold = parseFloat(process.env.FACE_MATCH_THRESHOLD || "0.5");
            const verified = distance < threshold;

            if (verified) {
                res.json({ message: "Face verified successfully", verified: true, distance });
            } else {
                res.status(401).json({ message: "Face does not match", verified: false, distance });
            }
        }
    );
};

function computeEuclideanDistance(a, b) {
    if (a.length !== b.length) return Infinity;
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
        sum += (a[i] - b[i]) ** 2;
    }
    return Math.sqrt(sum);
}
