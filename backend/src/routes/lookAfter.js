const express = require('express');
const router = express.Router();
const { listLookAfters, getLookAfter, createLookAfter, endLookAfter } = require('../controllers/lookAfterController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listLookAfters);
router.get('/:id', getLookAfter);
router.post('/', requireRole('admin'), createLookAfter);
router.patch('/:id/end', requireRole('admin'), endLookAfter);

module.exports = router;
