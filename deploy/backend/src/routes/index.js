const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

const authRoutes = require('./authRoutes');
const checkinRoutes = require('./checkinRoutes');
const settingsRoutes = require('./settingsRoutes');

router.use('/auth', authRoutes);
router.use('/checkin', checkinRoutes);
router.use('/settings', settingsRoutes);

module.exports = router;
