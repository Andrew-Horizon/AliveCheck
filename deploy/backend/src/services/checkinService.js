const db = require('../config/db');

class CheckinService {
  /**
   * Performs check-in operations: updates last active time and records log.
   */
  static async performCheckin(userId, { diaryText, latitude, longitude }) {
    // We should ideally use a transaction here since two tables are affected
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Update user bounds (Reset Last Active Time & cancel any pending alert status)
      await connection.query(
        `UPDATE users 
         SET last_active_time = CURRENT_TIMESTAMP, 
             alert_sent = FALSE 
         WHERE id = ?`,
        [userId]
      );

      // 2. Insert trace record into checkin logs
      await connection.query(
        `INSERT INTO checkin_logs (user_id, diary_text, latitude, longitude)
         VALUES (?, ?, ?, ?)`,
        [userId, diaryText || null, latitude || null, longitude || null]
      );

      // (Optional - Requirement) Update last known location into user's "last_messages" for quick retrieval by the daemon
      // To prevent massive joins for daemon, we can upsert `last_messages` with new location bounds.
      
      const [existingMessage] = await connection.query(
         `SELECT id FROM last_messages WHERE user_id = ?`,
         [userId]
      );
      
      if (existingMessage.length > 0) {
         await connection.query(
           `UPDATE last_messages 
            SET last_latitude = ?, last_longitude = ? 
            WHERE user_id = ?`,
           [latitude || null, longitude || null, userId]
         );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = CheckinService;
