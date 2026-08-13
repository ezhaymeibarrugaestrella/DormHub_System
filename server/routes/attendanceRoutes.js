const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/authMiddleware");
const {
    getAll,
    getToday,
    markAttendance,
    updateAttendance,
    getStudents,
    nightlyCheckIn,
    getNightlyAttendance,
    getStudentNightlyStatus
} = require("../controllers/attendanceController");

router.get("/", verifyToken, getAll);
router.get("/today", verifyToken, getToday);
router.get("/students", verifyToken, getStudents);
router.post("/", verifyToken, markAttendance);
router.put("/:id", verifyToken, updateAttendance);
router.post("/nightly/checkin", verifyToken, nightlyCheckIn);
router.get("/nightly", verifyToken, getNightlyAttendance);
router.get("/nightly/status", verifyToken, getStudentNightlyStatus);

module.exports = router;
