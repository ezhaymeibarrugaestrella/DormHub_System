const User = require("../models/User");
const WebauthnCredential = require("../models/WebauthnCredential");
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

exports.getStatus = async (req, res) => {
    try {
        const registered = Boolean(await WebauthnCredential.exists({ user_id: req.user.id }));
        res.json({ registered, fingerprint_registered: registered });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.beginRegistration = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

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

        const existing = await WebauthnCredential.exists({ credential_id: credInfo.id });
        if (existing) return res.status(400).json({ message: "Credential already registered" });

        await WebauthnCredential.create({
            user_id: userId,
            credential_id: credInfo.id,
            public_key: Buffer.from(credInfo.publicKey).toString("base64"),
            counter: credInfo.counter,
            transports: JSON.stringify(credInfo.transports || [])
        });
        await User.findByIdAndUpdate(userId, { fingerprint_registered: true });
        delete challenges[`register_${userId}`];
        res.json({ message: "Biometric registered successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Registration failed", error: error.message });
    }
};

exports.beginAuthentication = async (req, res) => {
    const userId = req.user.id;
    try {
        const credentials = await WebauthnCredential.find({ user_id: userId });
        if (credentials.length === 0) return res.status(400).json({ message: "No biometric registered" });

        const options = await generateAuthenticationOptions({
            rpID,
            userVerification: "required",
            allowCredentials: credentials.map((credential) => ({
                id: credential.credential_id,
                type: "public-key",
                transports: JSON.parse(credential.transports || "[]")
            }))
        });
        challenges[`auth_${userId}`] = options.challenge;
        res.json(options);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to generate authentication options" });
    }
};

exports.completeAuthentication = async (req, res) => {
    try {
        const userId = req.user.id;
        const { assertion } = req.body;

        const expectedChallenge = challenges[`auth_${userId}`];

        if (!expectedChallenge) {
            return res.status(400).json({ message: "No authentication in progress" });
        }

        const storedCred = await WebauthnCredential.findOne({ user_id: userId, credential_id: assertion.id });
        if (!storedCred) return res.status(401).json({ message: "Credential not found", verified: false });

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

            storedCred.counter = verification.authenticationInfo.newCounter;
            await storedCred.save();
            delete challenges[`auth_${userId}`];
            res.json({ message: "Biometric verified", verified: true, credentialId: assertion.id });
        } catch (error) {
            console.error(error);
            res.status(401).json({ message: "Biometric verification failed", verified: false });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Authentication failed" });
    }
};
