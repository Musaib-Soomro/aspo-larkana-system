const express = require('express');
const router = express.Router();
const { listDeliveryLogs, getMonthlyDelivery, createLog, updateLog } = require('../controllers/vpDeliveryController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listDeliveryLogs);
router.get('/monthly', getMonthlyDelivery);
router.post('/', requireRole('admin'), createLog);
router.put('/:id', requireRole('admin'), updateLog);

module.exports = router;
