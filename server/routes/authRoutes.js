const express = require("express");
const router = express.Router();

const {
    register,
    login,
    verifyEmail,
    resendVerification
} = require("../controllers/authController");

const {
    loginLimiter,
    registerLimiter,
    resendLimiter,
    verifyLimiter
} = require("../config/rateLimits");
const { EMAIL_VERIFICATION_ENABLED } = require("../config/featureFlags");

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
if (EMAIL_VERIFICATION_ENABLED) {
    router.post("/verify-email", verifyLimiter, verifyEmail);
    router.post("/resend-verification", resendLimiter, resendVerification);
}

module.exports = router;
