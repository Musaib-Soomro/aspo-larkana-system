const express = require('express');
const router = express.Router();
const { getMonthlyRegister, markAttendance, getAttendanceReport, createLeaveMemo, listLeaveMemos } = require('../controllers/attendanceController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', getMonthlyRegister);
router.post('/', requireRole('admin'), markAttendance);
router.get('/report', getAttendanceReport);
router.get('/leave-memos', listLeaveMemos);
router.post('/leave-memo', requireRole('admin'), createLeaveMemo);

module.exports = router;
