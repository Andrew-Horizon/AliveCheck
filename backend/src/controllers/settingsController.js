const db = require('../config/db');

class SettingsController {
  
  // ========================
  // 1. Sleep/Pause Mode
  // ========================

  static async setPauseStatus(req, res) {
    const userId = req.user.id;
    const { resumeTime } = req.body; // Expects an ISO string time e.g., '2026-05-01T12:00:00Z'

    if (!resumeTime) {
      return res.status(400).json({ error: 'Valid resumeTime is required to trigger sleep mode.' });
    }

    try {
      await db.query(`UPDATE users SET status = 'paused', resume_time = ? WHERE id = ?`, [new Date(resumeTime), userId]);
      res.status(200).json({ message: 'Sleep mode activated. The daemon will ignore you until the resume time.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to update status.' });
    }
  }

  static async clearPauseStatus(req, res) {
    const userId = req.user.id;
    try {
      await db.query(`UPDATE users SET status = 'active', resume_time = NULL, last_active_time = CURRENT_TIMESTAMP WHERE id = ?`, [userId]);
      res.status(200).json({ message: 'Guardian active again. Your clock has been reset.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to restore active status.' });
    }
  }

  // ========================
  // 2. Emergency Contacts
  // ========================

  static async getContacts(req, res) {
    const userId = req.user.id;
    try {
      const [contacts] = await db.query(`SELECT id, name, relation, email, phone FROM emergency_contacts WHERE user_id = ?`, [userId]);
      res.status(200).json({ data: contacts });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch emergency contacts.' });
    }
  }

  static async addContact(req, res) {
    const userId = req.user.id;
    const { name, relation, email, phone } = req.body;

    if (!name || !relation) {
      return res.status(400).json({ error: 'Name and relation are required.' });
    }

    try {
      // Check count limit
      const [counts] = await db.query(`SELECT COUNT(*) as count FROM emergency_contacts WHERE user_id = ?`, [userId]);
      if (counts[0].count >= 3) {
        return res.status(400).json({ error: 'Maximum limit of 3 emergency contacts reached.' });
      }

      const [result] = await db.query(
        `INSERT INTO emergency_contacts (user_id, name, relation, email, phone) VALUES (?, ?, ?, ?, ?)`,
        [userId, name, relation, email || null, phone || null]
      );
      res.status(201).json({ message: 'Contact added successfully.', id: result.insertId });
    } catch (error) {
      res.status(500).json({ error: 'Failed to insert contact.' });
    }
  }

  static async removeContact(req, res) {
    const userId = req.user.id;
    const contactId = req.params.id;

    try {
      await db.query(`DELETE FROM emergency_contacts WHERE id = ? AND user_id = ?`, [contactId, userId]);
      res.status(200).json({ message: 'Contact removed successfully.' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove contact.' });
    }
  }

  // ========================
  // 3. SOS Message / Last Words
  // ========================

  static async getMessage(req, res) {
    const userId = req.user.id;
    try {
      const [messages] = await db.query(`SELECT content_type, content FROM last_messages WHERE user_id = ? LIMIT 1`, [userId]);
      res.status(200).json({ data: messages[0] || null });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch SOS message.' });
    }
  }

  static async updateMessage(req, res) {
    const userId = req.user.id;
    const { contentType, content } = req.body;

    if (!content) {
       return res.status(400).json({ error: 'Content is required.' });
    }

    try {
      // Upsert logic
      await db.query(
        `INSERT INTO last_messages (user_id, content_type, content) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE content_type = VALUES(content_type), content = VALUES(content);`,
        [userId, contentType || 'text', content]
      );
      res.status(200).json({ message: 'SOS Message updated successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to upsert SOS message.' });
    }
  }

}

module.exports = SettingsController;
