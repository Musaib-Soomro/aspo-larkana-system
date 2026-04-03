const express = require('express');
const router = express.Router();
const { listRevenue, getPendingOffices, getRevenueEntry, upsertRevenue, updateRevenue, getMonthlyTotals } = require('../controllers/revenueController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/pending-offices', getPendingOffices);
router.get('/monthly-totals', getMonthlyTotals);
router.get('/', listRevenue);
router.get('/:id', getRevenueEntry);
router.post('/', upsertRevenue);
router.put('/:id', updateRevenue);

module.exports = router;
