const db = require('../config/db');
const transporter = require('../config/mail');

class AlertService {
  /**
   * Dispatches the final alert to all emergency contacts of a given user.
   */
  static async sendEmergencyAlerts(user, contacts, lastMessage) {
    if (!contacts || contacts.length === 0) return;

    // Compose location string if coordinates exist
    let locationInfo = '未提供最后已知位置。';
    if (lastMessage && lastMessage.last_latitude && lastMessage.last_longitude) {
       locationInfo = `最后已知位置坐标：[纬度: ${lastMessage.last_latitude}, 经度: ${lastMessage.last_longitude}]\n您可以尝试在地图应用中搜索此坐标寻找线索。`;
    }

    const messageContent = lastMessage?.content || '该用户未提前设置留言内容。';

    console.log(`[AlertService] Assembling emails for user ${user.username} - Contacts count: ${contacts.length}`);

    const promises = contacts.map(contact => {
      if (!contact.email) return Promise.resolve(); // Skip if no email provided for this contact

      const mailOptions = {
        from: `"AliveCheck 守护终端" <${process.env.SMTP_USER}>`,
        to: contact.email,
        subject: `【🚨 紧急求助】您的朋友 ${user.username} 可能已遭遇意外！`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333;">
            <div style="background-color: #d32f2f; color: white; padding: 15px; border-radius: 5px; font-size: 20px; font-weight: bold;">
              ⚠️ 生存状态超时警告
            </div>
            <p>您好 <strong>${contact.name}</strong> (${contact.relation}):</p>
            <p>我们是 AliveCheck 系统。非常抱歉地通过这种方式联络您。</p>
            <p>您的密友/亲人 <strong>${user.username}</strong> 已经超过设定安全期限（48小时）未向系统进行安全报备。ta 曾将您设为紧急联系人。</p>
            
            <fieldset style="border: 1px solid #ccc; padding: 10px; margin-top: 20px;">
              <legend style="font-weight: bold; color: #d32f2f;">ta留下的最后求救信息：</legend>
              <p style="white-space: pre-wrap;">${messageContent}</p>
            </fieldset>

            <fieldset style="border: 1px solid #ccc; padding: 10px; margin-top: 20px;">
              <legend style="font-weight: bold; color: #1976d2;">定位追踪：</legend>
              <p>${locationInfo}</p>
            </fieldset>

            <p style="margin-top: 30px; font-size: 12px; color: #777;">
              本邮件由系统自动发送，这意味着用户设定的静默防线已被突破。<br/>
              请尽快尝试通过电话、微信或其他方式联系 ${user.username} 本人。如果确信发生意外，请考虑联系当地警方寻求救助。
            </p>
          </div>
        `
      };

      return transporter.sendMail(mailOptions);
    });

    try {
      await Promise.all(promises);
      console.log(`[AlertService] Successfully notified contacts for user ${user.id}`);
      return true;
    } catch (error) {
       console.error(`[AlertService] Email dispatch failed for user ${user.id}:`, error);
       // We can implement a retry queue later based on error type
       throw error;
    }
  }
}

module.exports = AlertService;
