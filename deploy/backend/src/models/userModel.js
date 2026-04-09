const db = require('../config/db');

class UserModel {
  // Find a user by their username
  static async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  }

  // Find a user by email
  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
  }

  // Find a user by phone
  static async findByPhone(phone) {
    const [rows] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    return rows[0];
  }

  // Find a user by ID
  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
  }

  // Create a new user
  static async create(userData) {
    const { username, passwordHash, email, phone } = userData;
    const [result] = await db.query(
      'INSERT INTO users (username, password_hash, email, phone) VALUES (?, ?, ?, ?)',
      [username, passwordHash, email || null, phone || null]
    );
    return result.insertId;
  }
}

module.exports = UserModel;
