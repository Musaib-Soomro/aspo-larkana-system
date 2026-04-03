const express = require('express');
const router = express.Router();
const { listAuditLog } = require('../controllers/auditLogController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listAuditLog);

module.exports = router;
