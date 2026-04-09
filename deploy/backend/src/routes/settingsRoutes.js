const express = require('express');
const router = express.Router();
const SettingsController = require('../controllers/settingsController');
const authenticateToken = require('../middleware/authMiddleware');

// All settings routes require auth
router.use(authenticateToken);

// Pause / Resume Logic
router.post('/pause', SettingsController.setPauseStatus);
router.post('/resume', SettingsController.clearPauseStatus);

// Emergency Contacts Management
router.get('/contacts', SettingsController.getContacts);
router.post('/contacts', SettingsController.addContact);
router.delete('/contacts/:id', SettingsController.removeContact);

// SOS Message Management
router.get('/message', SettingsController.getMessage);
router.post('/message', SettingsController.updateMessage);

module.exports = router;
