const express = require("express");
const router = express.Router();

const {
    getAll,
    getPendingCount,
    getRecent,
    create,
    update
} = require("../controllers/gateRequestController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getAll);
router.get("/pending/count", verifyToken, getPendingCount);
router.get("/recent", verifyToken, getRecent);
router.post("/", verifyToken, create);
router.put("/:id", verifyToken, update);

module.exports = router;
