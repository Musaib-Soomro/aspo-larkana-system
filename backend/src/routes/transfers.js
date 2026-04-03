const express = require('express');
const router = express.Router();
const { listTransfers, getTransfer, createTransfer, updateTransfer, deleteTransfer } = require('../controllers/transferController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listTransfers);
router.get('/:id', getTransfer);
router.post('/', requireRole('admin'), createTransfer);
router.put('/:id', requireRole('admin'), updateTransfer);
router.delete('/:id', requireRole('admin'), deleteTransfer);

module.exports = router;
