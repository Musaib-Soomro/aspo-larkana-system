const express = require('express');
const router = express.Router();
const { listLeave, getLeaveBalance, getAllLeaveBalances, createLeave, updateLeave, listLeaveTypes, createLeaveType, updateLeaveType } = require('../controllers/leaveController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/types', listLeaveTypes);
router.post('/types', createLeaveType);
router.put('/types/:id', updateLeaveType);
router.get('/balances', getAllLeaveBalances);
router.get('/balance/:staff_id', getLeaveBalance);
router.get('/', listLeave);
router.post('/', createLeave);
router.put('/:id', updateLeave);

module.exports = router;
