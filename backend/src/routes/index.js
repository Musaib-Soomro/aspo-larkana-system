const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth'));
router.use('/offices', require('./offices'));
router.use('/staff', require('./staff'));
router.use('/leave', require('./leave'));
router.use('/inspections', require('./inspections'));
router.use('/complaints', require('./complaints'));
router.use('/revenue', require('./revenue'));
router.use('/articles', require('./articles'));
router.use('/inquiries', require('./inquiries'));
router.use('/dashboard', require('./dashboard'));
router.use('/pdf', require('./pdf'));
router.use('/settings', require('./settings'));
router.use('/audit-log', require('./auditLog'));
router.use('/users', require('./users'));
router.use('/transfers', require('./transfers'));
router.use('/look-after', require('./lookAfter'));
router.use('/attendance',       require('./attendance'));
router.use('/edbo-programmes',  require('./edboProgrammes'));
router.use('/overseer-diaries', require('./overseerDiaries'));
router.use('/work-assignments', require('./workAssignments'));
router.use('/vp-routes',        require('./vpRoutes'));
router.use('/vp-delivery',      require('./vpDelivery'));
router.use('/upload',           require('./upload'));

module.exports = router;
