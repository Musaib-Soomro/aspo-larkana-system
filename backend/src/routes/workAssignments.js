const express = require('express');
const router = express.Router();
const { listAssignments, getAssignment, createAssignment, updateAssignment } = require('../controllers/workAssignmentController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listAssignments);
router.get('/:id', getAssignment);
router.post('/', requireRole('admin'), createAssignment);
router.put('/:id', requireRole('admin'), updateAssignment);

module.exports = router;
