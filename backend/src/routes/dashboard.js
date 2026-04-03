const express = require('express');
const router = express.Router();
const { getSummary, getPostmasterSummary } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/summary', getSummary);
router.get('/postmaster-summary', getPostmasterSummary);

module.exports = router;
