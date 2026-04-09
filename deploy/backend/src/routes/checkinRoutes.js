const express = require('express');
const router = express.Router();
const CheckinController = require('../controllers/checkinController');
const authenticateToken = require('../middleware/authMiddleware');

// The ping endpoint, heavily protected by JWT token validator
router.post('/ping', authenticateToken, CheckinController.ping);

module.exports = router;
