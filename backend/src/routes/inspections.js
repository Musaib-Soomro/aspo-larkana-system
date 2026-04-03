const express = require('express');
const router = express.Router();
const { listInspections, getDueThisMonth, getOverdue, getInspection, createProgramme, updateInspection, addVisit, deleteVisit } = require('../controllers/inspectionController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/due-this-month', getDueThisMonth);
router.get('/overdue', getOverdue);
router.get('/', listInspections);
router.get('/:id', getInspection);
router.post('/programme', createProgramme);
router.put('/:id', updateInspection);
router.post('/:id/visits', addVisit);
router.delete('/visits/:visitId', deleteVisit);

module.exports = router;
