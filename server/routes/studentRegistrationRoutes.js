const express = require("express");
const router = express.Router();

const {
    register,
    getAll,
    getPendingCount,
    updateStatus
} = require("../controllers/studentRegistrationController");

const { verifyToken } = require("../middleware/authMiddleware");

router.post("/register", register);
router.get("/", verifyToken, getAll);
router.get("/pending/count", verifyToken, getPendingCount);
router.put("/:id", verifyToken, updateStatus);

module.exports = router;
