const express = require("express");
const router = express.Router();

const {
    getStatus,
    beginRegistration,
    completeRegistration,
    beginAuthentication,
    completeAuthentication
} = require("../controllers/webauthnController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/status", verifyToken, getStatus);
router.post("/register/begin", verifyToken, beginRegistration);
router.post("/register/complete", verifyToken, completeRegistration);
router.post("/auth/begin", verifyToken, beginAuthentication);
router.post("/auth/complete", verifyToken, completeAuthentication);

module.exports = router;
