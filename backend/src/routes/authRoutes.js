const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', AuthController.register);

// POST /api/auth/login
router.post('/login', AuthController.login);

// GET /api/auth/me
router.get('/me', authenticateToken, AuthController.getMe);

// POST /api/auth/send-code
router.post('/send-code', AuthController.sendCode);

// POST /api/auth/login-sms
router.post('/login-sms', AuthController.loginSms);

module.exports = router;
