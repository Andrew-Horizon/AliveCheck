const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

class AuthService {
  static async register(userData) {
    const { username, password, email, phone } = userData;

    // 1. Check if user already exists
    const existingUser = await UserModel.findByUsername(username);
    if (existingUser) {
      const error = new Error('该用户名已存在');
      error.status = 409;
      throw error;
    }
    
    // Check if phone already registered
    const existingPhone = await UserModel.findByPhone(phone);
    if (existingPhone) {
      const error = new Error('该手机号已被注册');
      error.status = 409;
      throw error;
    }

    if (email) {
       const existingEmail = await UserModel.findByEmail(email);
       if (existingEmail) {
          const error = new Error('该邮箱已被注册');
          error.status = 409;
          throw error;
       }
    }

    // 2. Hash the password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Save to database
    const newUserId = await UserModel.create({
      username,
      passwordHash,
      email,
      phone
    });

    return { id: newUserId, username, email };
  }

  static async login(username, password) {
    // 1. Find the user
    const user = await UserModel.findByUsername(username);
    if (!user) {
      const error = new Error('用户名或密码错误');
      error.status = 401;
      throw error;
    }

    // 2. Compare passwords
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      const error = new Error('用户名或密码错误');
      error.status = 401;
      throw error;
    }

    // 3. Generate JWT
    const payload = {
      id: user.id,
      username: user.username,
      status: user.status
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    return { token, user: payload };
  }

  static async loginByPhone(phone) {
    // 1. Find the user
    const user = await UserModel.findByPhone(phone);
    if (!user) {
      const error = new Error('该手机号未注册');
      error.status = 404;
      throw error;
    }

    // 2. Generate JWT directly
    const payload = {
      id: user.id,
      username: user.username,
      status: user.status
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    });

    return { token, user: payload };
  }
  static async getProfile(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      const error = new Error('未找到该用户');
      error.status = 404;
      throw error;
    }
    
    // Return safe profile info
    return {
      id: user.id,
      username: user.username,
      status: user.status,
      lastActiveTime: user.last_active_time,
      resumeTime: user.resume_time,
      alertSent: user.alert_sent
    };
  }
}

module.exports = AuthService;
