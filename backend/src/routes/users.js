const express = require('express');
const router = express.Router();
const { listUsers, createUser, updateUser } = require('../controllers/userController');
const { authenticate, requireRole } = require('../middleware/auth');

router.use(authenticate);
router.use(requireRole('admin'));   // all user management is admin-only

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);

module.exports = router;
