const express = require("express");
const router = express.Router();

const {
    getProfile,
    updateProfile,
    changePassword,
    getSystemInfo
} = require("../controllers/settingsController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, updateProfile);
router.put("/change-password", verifyToken, changePassword);
router.get("/system", verifyToken, getSystemInfo);

module.exports = router;
