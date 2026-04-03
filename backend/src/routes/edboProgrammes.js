const express = require('express');
const router = express.Router();
const { listProgrammes, getProgramme, createProgramme, updateAssignment } = require('../controllers/edboProgrammeController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listProgrammes);
router.get('/:id', getProgramme);
router.post('/', requireRole('admin'), createProgramme);
router.patch('/assignments/:id', requireRole('admin'), updateAssignment);

module.exports = router;
