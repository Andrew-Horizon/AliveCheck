const CheckinService = require('../services/checkinService');

class CheckinController {
  
  static async ping(req, res) {
    const userId = req.user.id;
    const { diaryText, latitude, longitude } = req.body;

    try {
      await CheckinService.performCheckin(userId, {
        diaryText,
        latitude,
        longitude
      });

      res.status(200).json({
        message: 'Check-in successful. Your countdown has been reset.',
        data: {
           resetTargetHours: 48,
           serverTime: new Date()
        }
      });
    } catch (error) {
      console.error('Checkin Error:', error);
      res.status(500).json({ error: 'Failed to record check-in status.' });
    }
  }
}

module.exports = CheckinController;
