const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authValidator } = require('../middlewares/validators');

router.post('/auth/login', authValidator.validateLogin, authController.login);
router.post('/auth/register', authValidator.validateRegister, authController.register);

module.exports = router;