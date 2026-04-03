const express = require('express');
const router = express.Router();
const { weeklyDiary, monthlyStatement, complaintMemo } = require('../controllers/pdfController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.post('/weekly-diary', weeklyDiary);
router.post('/monthly-statement', monthlyStatement);
router.post('/complaint-memo', complaintMemo);

module.exports = router;
