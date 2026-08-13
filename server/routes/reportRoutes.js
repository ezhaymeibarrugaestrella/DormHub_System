const express = require("express");
const router = express.Router();

const {
    getAttendanceReport,
    getDemeritReport,
    getGateRequestReport,
    getReportSummary,
    getMonthlyReport,
    getStudentReport
} = require("../controllers/reportController");

const { verifyToken } = require("../middleware/authMiddleware");

router.get("/attendance", verifyToken, getAttendanceReport);
router.get("/demerits", verifyToken, getDemeritReport);
router.get("/gate-requests", verifyToken, getGateRequestReport);
router.get("/summary", verifyToken, getReportSummary);
router.get("/monthly", verifyToken, getMonthlyReport);
router.get("/students", verifyToken, getStudentReport);

module.exports = router;
