const express = require('express');
const Joi = require('joi');
const router = express.Router();
const { login, logout, me, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string().min(8).required(),
});

router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

module.exports = router;
