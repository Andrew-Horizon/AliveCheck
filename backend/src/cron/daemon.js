const cron = require('node-cron');
const db = require('../config/db');
const AlertService = require('../services/alertService');

/**
 * Sweeper logic executed periodically.
 */
async function runSweeper() {
  console.log('[Daemon] Running heartbeat scan sweep at', new Date().toISOString());

  try {
    // Phase 1: Retrieve high-risk users
    // Criteria: status is 'active', alert_sent is FALSE, last_active_time is over 48 hours ago
    const [highRiskUsers] = await db.query(
      `SELECT id, username, email FROM users 
       WHERE status = 'active' 
       AND alert_sent = FALSE 
       AND TIMESTAMPDIFF(HOUR, last_active_time, CURRENT_TIMESTAMP) >= 48`
    );

    if (highRiskUsers.length === 0) {
      console.log('[Daemon] No high-risk users found. All safe.');
      return;
    }

    console.log(`[Daemon] Discovered ${highRiskUsers.length} lost users. Commencing emergency protocol.`);

    // Phase 2: Process each user
    for (const user of highRiskUsers) {
      try {
        // Fetch emergency contacts
        const [contacts] = await db.query(
          `SELECT name, relation, email, phone FROM emergency_contacts WHERE user_id = ?`,
          [user.id]
        );

        // Fetch last message & location
        const [messages] = await db.query(
          `SELECT content, last_latitude, last_longitude FROM last_messages WHERE user_id = ? LIMIT 1`,
          [user.id]
        );
        const lastMessage = messages.length > 0 ? messages[0] : null;

        if (contacts.length === 0) {
          console.log(`[Daemon] User ${user.username} has no emergency contacts set. Skipping.`);
          // Still mark as sent to avoid endless useless processing
          await db.query(`UPDATE users SET alert_sent = TRUE WHERE id = ?`, [user.id]);
          continue;
        }

        // Send out alerts
        await AlertService.sendEmergencyAlerts(user, contacts, lastMessage);

        // Phase 3: Mark as processed
        await db.query(`UPDATE users SET alert_sent = TRUE WHERE id = ?`, [user.id]);

      } catch (userErr) {
        console.error(`[Daemon] Failed to process emergency sequence for user ${user.id}:`, userErr);
        // Failures keep alert_sent = FALSE, meaning it explicitly becomes a Natural Retry on next cron hour.
      }
    }
  } catch (error) {
    console.error('[Daemon] Fatal error during sweep execution:', error);
  }
}

// Start the cron task. Running every hour at minute 0.
// For testing purposes, you can change this to '* * * * *' (every minute)
const startWatcher = () => {
  console.log('[Daemon] Heartbeat daemon watcher initialized.');
  cron.schedule('0 * * * *', runSweeper);

  // Optionally, run it once immediately on startup
  // runSweeper();
};

module.exports = {
  startWatcher,
  runSweeper // Exported for manual trigger testing if needed
};
