const express = require('express');
const router = express.Router();
const { listInquiries, getInquiry, createInquiry, updateInquiry } = require('../controllers/inquiryController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listInquiries);
router.get('/:id', getInquiry);
router.post('/', createInquiry);
router.put('/:id', updateInquiry);

module.exports = router;
