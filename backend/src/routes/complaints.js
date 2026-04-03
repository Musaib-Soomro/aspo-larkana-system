const express = require('express');
const router = express.Router();
const { listComplaints, getActiveComplaints, getComplaint, createComplaint, updateComplaint } = require('../controllers/complaintController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/active', getActiveComplaints);
router.get('/', listComplaints);
router.get('/:id', getComplaint);
router.post('/', createComplaint);
router.put('/:id', updateComplaint);

module.exports = router;
