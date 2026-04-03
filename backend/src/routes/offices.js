const express = require('express');
const router = express.Router();
const { listOffices, getOffice, createOffice, updateOffice, deactivateOffice } = require('../controllers/officeController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listOffices);
router.get('/:id', getOffice);
router.post('/', createOffice);
router.put('/:id', updateOffice);
router.delete('/:id', deactivateOffice);

module.exports = router;
