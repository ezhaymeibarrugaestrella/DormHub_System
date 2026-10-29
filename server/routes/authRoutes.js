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

router.post("/register", registerLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/verify-email", verifyLimiter, verifyEmail);
router.post("/resend-verification", resendLimiter, resendVerification);

module.exports = router;
