const AuthService = require('../services/authService');
const smsService = require('../services/smsService');

class AuthController {
  
  static async register(req, res) {
    const { username, password, email, phone, code } = req.body;

    // Basic validation
    if (!username || !password || !phone || !code) {
      return res.status(400).json({ error: '必须填写账号、密码、手机号和验证码' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Verify SMS Code
    const verifyObj = smsService.verifyCode(phone, code);
    if (!verifyObj.success) {
      return res.status(400).json({ error: verifyObj.msg });
    }

    // Call service to register
    const newUser = await AuthService.register({ username, password, email, phone });
    
    res.status(201).json({
      message: 'User registered successfully',
      data: newUser
    });
  }

  static async login(req, res) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Call service to login
    const result = await AuthService.login(username, password);
    
    res.status(200).json({
      message: 'Login successful',
      data: result // contains token and basic user info
    });
  }
  static async getMe(req, res) {
    const userId = req.user.id;
    // Call service to get profile details including time
    const profile = await AuthService.getProfile(userId);
    res.status(200).json({ data: profile });
  }

  static async sendCode(req, res) {
    const { phone } = req.body;
    if (!phone || phone.length < 11) {
      return res.status(400).json({ error: '请输入有效的手机号' });
    }
    await smsService.sendCode(phone);
    res.status(200).json({ message: '验证码已发送' });
  }

  static async loginSms(req, res) {
    const { phone, code } = req.body;
    if (!phone || !code) {
      return res.status(400).json({ error: '手机号和验证码不可为空' });
    }
    
    // Check SMS code
    const verifyObj = smsService.verifyCode(phone, code);
    if (!verifyObj.success) {
      return res.status(400).json({ error: verifyObj.msg });
    }

    // Attempt login by phone
    const result = await AuthService.loginByPhone(phone);
    res.status(200).json({
      message: 'Login successful via SMS',
      data: result
    });
  }
}

module.exports = AuthController;
