# AliveCheck (个人守护终端) 🛡️

**AliveCheck** 是一款基于“死间开关”逻辑的自动化防失联守护方案。它致力于在用户失去行动能力（如突发疾病、单人运动意外等）且无法主动求救的极端困境下，自动向紧急联系人发送求救信及最后定位。

## 🌟 核心功能
- **心跳签到**：用户需在 48 小时周期内完成极简签到。
- **动态预警**：36 小时自动推送催促通知，48 小时自动触发求救程序。
- **多维分发**：调用阿里云短信与 SMTP 邮件网关，将预留信件与 GPS 坐标分发至响应组。
- **玻璃拟态 UI**：极简赛博风设计，适配移动端原生环境。

## 🛠️ 技术栈
- **前端**：Uni-app (Vue 3 / Composition API)
- **后端**：Node.js (Express) + PM2 常驻守护
- **数据库**：MySQL 8.0
- **服务集成**：阿里云短信服务 SDK + Nodemailer

## 🚀 部署指引
1. **环境准备**：Node.js 20+, MySQL 8.0。
2. **后端配置**：
   - 在 `backend/` 目录下创建 `.env` 文件，填入您的 DB 密码及阿里云 AccessKey。
   - 导入 `schema.sql` 建立数据库。
   - `npm install` && `pm2 start src/app.js`。
3. **前端编译**：使用 HBuilderX 打开 `front/` 目录，发行至 Android APK。

## 📄 许可证
Open Source under MIT License.
