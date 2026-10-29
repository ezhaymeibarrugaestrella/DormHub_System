require("dotenv").config();

const mongoose = require("mongoose");

require("../models");
const User = require("../models/User");
const EmailVerificationToken = require("../models/EmailVerificationToken");
const FaceDescriptor = require("../models/FaceDescriptor");
const WebauthnCredential = require("../models/WebauthnCredential");

const TEST_EMAIL_PREFIX = "phase1-test-";

async function cleanup() {
    await mongoose.connect(process.env.MONGODB_URI);

    const users = await User.find({ email: { $regex: `^${TEST_EMAIL_PREFIX}` } });
    const ids = users.map((u) => u._id);

    let deleted = { users: 0, tokens: 0, faces: 0, webauthn: 0 };

    if (ids.length) {
        deleted.tokens = (await EmailVerificationToken.deleteMany({ user_id: { $in: ids } })).deletedCount;
        deleted.faces = (await FaceDescriptor.deleteMany({ user_id: { $in: ids } })).deletedCount;
        deleted.webauthn = (await WebauthnCredential.deleteMany({ user_id: { $in: ids } })).deletedCount;
        deleted.users = (await User.deleteMany({ _id: { $in: ids } })).deletedCount;
    }

    deleted.tokens +=
        (await EmailVerificationToken.deleteMany({ email: { $regex: `^${TEST_EMAIL_PREFIX}` } }))
            .deletedCount;

    return deleted;
}

async function main() {
    const deleted = await cleanup();
    console.log(
        `Cleanup complete: ${deleted.users} users, ${deleted.tokens} verification tokens, ` +
            `${deleted.faces} face descriptors, ${deleted.webauthn} webauthn credentials`
    );
    await mongoose.disconnect();
}

if (require.main === module) {
    main().catch((err) => {
        console.error("Cleanup failed:", err);
        process.exit(1);
    });
}

module.exports = { cleanup, TEST_EMAIL_PREFIX };
