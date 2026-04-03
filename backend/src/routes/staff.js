const express = require('express');
const router = express.Router();
const { listStaff, getStaffOnLeave, getStaffOnLookafter, getStaff, createStaff, updateStaff, deactivateStaff } = require('../controllers/staffController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/on-leave', getStaffOnLeave);
router.get('/on-lookafter', getStaffOnLookafter);
router.get('/', listStaff);
router.get('/:id', getStaff);
router.post('/', createStaff);
router.put('/:id', updateStaff);
router.delete('/:id', deactivateStaff);

module.exports = router;
