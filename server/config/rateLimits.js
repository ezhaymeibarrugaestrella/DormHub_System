const { rateLimit } = require("express-rate-limit");

const authRateMessage = (message) => ({
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message }
});

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    skipSuccessfulRequests: true,
    ...authRateMessage("Too many sign-in attempts. Please wait a few minutes and try again.")
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 20,
    ...authRateMessage("Too many registration attempts. Please try again later.")
});

const resendLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    skipSuccessfulRequests: true,
    ...authRateMessage("Too many verification requests. Please wait a few minutes and try again.")
});

const verifyLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    ...authRateMessage("Too many verification attempts. Please wait a few minutes and try again.")
});

module.exports = { loginLimiter, registerLimiter, resendLimiter, verifyLimiter };
