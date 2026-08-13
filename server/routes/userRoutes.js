const express = require("express");
const router = express.Router();

const {
    getAll,
    getById,
    update,
    remove
} = require("../controllers/userController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/", verifyToken, getAll);
router.get("/:id", verifyToken, getById);
router.put("/:id", verifyToken, update);
router.delete("/:id", verifyToken, remove);

module.exports = router;
