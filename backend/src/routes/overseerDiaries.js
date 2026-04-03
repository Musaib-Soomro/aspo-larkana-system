const express = require('express');
const router = express.Router();
const { listDiaries, getDiary, createDiary, updateDiary } = require('../controllers/overseerDiaryController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listDiaries);
router.get('/:id', getDiary);
router.post('/', requireRole('admin'), createDiary);
router.put('/:id', requireRole('admin'), updateDiary);

module.exports = router;
