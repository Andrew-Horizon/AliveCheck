const Dypnsapi20170525 = require('@alicloud/dypnsapi20170525');
const OpenApi = require('@alicloud/openapi-client');
const Util = require('@alicloud/tea-util');
const Credential = require('@alicloud/credentials');

// In-memory verification cache: phone -> { code: string, expiresAt: number }
const codeCache = new Map();

class SmsService {
  constructor() {
    this.client = null;
    
    const accessKeyId = process.env.ALIYUN_ACCESS_KEY_ID;
    const accessKeySecret = process.env.ALIYUN_ACCESS_KEY_SECRET;

    if (accessKeyId && accessKeySecret) {
       console.log('[SMS] Aliyun credentials detected. Initializing real Dypnsapi client.');
       const credential = new Credential.default({
         type: 'access_key',
         accessKeyId: accessKeyId,
         accessKeySecret: accessKeySecret
       });
       const config = new OpenApi.Config({
         credential,
         endpoint: 'dypnsapi.aliyuncs.com'
       });
       this.client = new Dypnsapi20170525.default(config);
    } else {
       console.log('[SMS] WARN: No Aliyun keys provided. Running in MOCK Mode.');
    }
  }

  // Generates 6 digit code, stores, and sends
  async sendCode(phone) {
    // Basic throttling or logic could go here
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 5 Minute Expiration
    const expiresAt = Date.now() + 5 * 60 * 1000;
    codeCache.set(phone, { code, expiresAt });

    if (this.client) {
      try {
        const request = new Dypnsapi20170525.SendSmsVerifyCodeRequest({
          phoneNumber: phone,
          signName: process.env.ALIYUN_SIGN_NAME || '阿里云短信测试',
          templateCode: process.env.ALIYUN_TEMPLATE_CODE,
          // 加上 min: "5" 防止用户没有配置 TemplateCode 导致采用系统默认模板（系统默认需要 min 变量）
          templateParam: JSON.stringify({ code: String(code), min: "5" })
        });
        const response = await this.client.sendSmsVerifyCodeWithOptions(request, new Util.RuntimeOptions({}));
        console.log(`[SMS][True] Send response:`, response.body);
      } catch (e) {
        console.error('[SMS] Aliyun Sending Error:', e.message);
        throw new Error('短信平台通信失败: ' + e.message);
      }
    } else {
      // Mock Terminal Printing
      console.log(`-------------------------------------------`);
      console.log(`[SMS MOCK] Simulated sending to: ${phone}`);
      console.log(`[SMS MOCK] -> YOUR VERIFICATION CODE IS: ${code} <-`);
      console.log(`-------------------------------------------`);
    }

    return true;
  }

  // Verify the code
  verifyCode(phone, submittedCode) {
    const record = codeCache.get(phone);
    if (!record) {
      return { success: false, msg: '验证码不存在或已过期' };
    }
    
    // Check expiration
    if (Date.now() > record.expiresAt) {
      codeCache.delete(phone);
      return { success: false, msg: '验证码已过期' };
    }

    // Check code
    if (record.code !== submittedCode) {
      return { success: false, msg: '验证码错误' };
    }

    // Burn on successful read
    codeCache.delete(phone);
    return { success: true };
  }
}

// Export a singleton
const smsService = new SmsService();
module.exports = smsService;
