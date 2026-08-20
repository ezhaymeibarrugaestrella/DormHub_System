const express = require("express");
const router = express.Router();

const {
    getAll,
    getByUser,
    getSummary,
    getMySummary,
    create,
    remove
} = require("../controllers/demeritController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getAll);
router.get("/my", verifyToken, getByUser);
router.get("/my/summary", verifyToken, getMySummary);
router.get("/summary", verifyToken, getSummary);
router.post("/", verifyToken, create);
router.delete("/:id", verifyToken, remove);

module.exports = router;
