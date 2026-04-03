const express = require('express');
const router = express.Router();
const { listRoutes, getRoute, createRoute, updateRoute } = require('../controllers/vpRouteController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.get('/', listRoutes);
router.get('/:id', getRoute);
router.post('/', requireRole('admin'), createRoute);
router.put('/:id', requireRole('admin'), updateRoute);

module.exports = router;
