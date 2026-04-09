const nodemailer = require('nodemailer');
require('dotenv').config();

// Create a generic transporter
// In production, you might be using SendGrid, AWS SES or a corporate SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT, // Usually 465 for secure, 587 for unsecure
  secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter;
