const express = require("express");
const router = express.Router();

const {
    getStatus,
    register,
    verify
} = require("../controllers/faceAuthController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/status", verifyToken, getStatus);
router.post("/register", verifyToken, register);
router.post("/verify", verifyToken, verify);

module.exports = router;
