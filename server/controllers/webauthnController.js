const db = require("../config/db");
const {
    generateRegistrationOptions,
    verifyRegistrationResponse,
    generateAuthenticationOptions,
    verifyAuthenticationResponse
} = require("@simplewebauthn/server");

const rpID = process.env.RP_ID || "localhost";
const expectedOrigin = process.env.RP_ORIGIN || "http://localhost:5000";

const getOrigins = (req) => {
    const origins = [expectedOrigin];
    const reqOrigin = req.headers.origin;
    if (reqOrigin && !origins.includes(reqOrigin)) {
        origins.push(reqOrigin);
    }
    return origins;
};

const challenges = {};

exports.getStatus = (req, res) => {
    db.query(
        "SELECT COUNT(*) AS count FROM webauthn_credentials WHERE user_id = ?",
        [req.user.id],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ registered: result[0].count > 0, fingerprint_registered: result[0].count > 0 });
        }
    );
};

exports.beginRegistration = async (req, res) => {
    try {
        const userId = req.user.id;

        db.query("SELECT * FROM users WHERE id = ?", [userId], async (err, users) => {
            if (err || users.length === 0) {
                return res.status(404).json({ message: "User not found" });
            }

            const user = users[0];

            const options = await generateRegistrationOptions({
                rpName: "DormHub",
                rpID,
                userName: user.email,
                userDisplayName: user.fullname,
                attestationType: "none",
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "discouraged"
                }
            });

            challenges[`register_${userId}`] = options.challenge;

            res.json(options);
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate registration options" });
    }
};

exports.completeRegistration = async (req, res) => {
    try {
        const userId = req.user.id;
        const { credential } = req.body;

        const expectedChallenge = challenges[`register_${userId}`];

        if (!expectedChallenge) {
            return res.status(400).json({ message: "No registration in progress. Please try again." });
        }

        const verification = await verifyRegistrationResponse({
            response: credential,
            expectedChallenge,
            expectedOrigin: getOrigins(req),
            expectedRPID: rpID,
            requireUserVerification: true
        });

        if (!verification.verified) {
            return res.status(400).json({ message: "Registration verification failed" });
        }

        const { credential: credInfo } = verification.registrationInfo;

        db.query(
            "SELECT id FROM webauthn_credentials WHERE credential_id = ?",
            [credInfo.id],
            (err, existing) => {
                if (err) return res.status(500).json(err);
                if (existing.length > 0) {
                    return res.status(400).json({ message: "Credential already registered" });
                }

                db.query(
                    `INSERT INTO webauthn_credentials 
                    (user_id, credential_id, public_key, counter, transports) 
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        userId,
                        credInfo.id,
                        Buffer.from(credInfo.publicKey).toString("base64"),
                        credInfo.counter,
                        JSON.stringify(credInfo.transports || [])
                    ],
                    (err) => {
                        if (err) return res.status(500).json(err);

                        db.query(
                            "UPDATE users SET fingerprint_registered = 1 WHERE id = ?",
                            [userId]
                        );

                        delete challenges[`register_${userId}`];

                        res.json({ message: "Biometric registered successfully" });
                    }
                );
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

exports.beginAuthentication = (req, res) => {
    const userId = req.user.id;

    db.query(
        "SELECT * FROM webauthn_credentials WHERE user_id = ?",
        [userId],
        async (err, credentials) => {
            if (err) return res.status(500).json(err);
            if (credentials.length === 0) {
                return res.status(400).json({ message: "No biometric registered" });
            }

            try {
                const options = await generateAuthenticationOptions({
                    rpID,
                    userVerification: "required",
                    allowCredentials: credentials.map(c => ({
                        id: c.credential_id,
                        type: "public-key",
                        transports: JSON.parse(c.transports || "[]")
                    }))
                });

                challenges[`auth_${userId}`] = options.challenge;

                res.json(options);
            } catch (error) {
                console.error(error);
                res.status(500).json({ message: "Failed to generate authentication options" });
            }
        }
    );
};

exports.completeAuthentication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { assertion } = req.body;

        const expectedChallenge = challenges[`auth_${userId}`];

        if (!expectedChallenge) {
            return res.status(400).json({ message: "No authentication in progress" });
        }

        db.query(
            "SELECT * FROM webauthn_credentials WHERE user_id = ? AND credential_id = ?",
            [userId, assertion.id],
            async (err, credentials) => {
                if (err) return res.status(500).json(err);
                if (credentials.length === 0) {
                    return res.status(401).json({ message: "Credential not found", verified: false });
                }

                const storedCred = credentials[0];

                try {
                    const verification = await verifyAuthenticationResponse({
                        response: assertion,
                        expectedChallenge,
                        expectedOrigin: getOrigins(req),
                        expectedRPID: rpID,
                        credential: {
                            id: storedCred.credential_id,
                            publicKey: Buffer.from(storedCred.public_key, "base64"),
                            counter: storedCred.counter,
                            transports: JSON.parse(storedCred.transports || "[]")
                        },
                        requireUserVerification: true
                    });

                    if (!verification.verified) {
                        return res.status(401).json({ message: "Biometric verification failed", verified: false });
                    }

                    db.query(
                        "UPDATE webauthn_credentials SET counter = ? WHERE id = ?",
                        [verification.authenticationInfo.newCounter, storedCred.id]
                    );

                    delete challenges[`auth_${userId}`];

                    res.json({ message: "Biometric verified", verified: true, credentialId: assertion.id });
                } catch (error) {
                    console.error(error);
                    res.status(401).json({ message: "Biometric verification failed", verified: false });
                }
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Authentication failed" });
    }
};
