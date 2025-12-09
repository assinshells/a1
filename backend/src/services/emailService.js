import nodemailer from "nodemailer";
import config from "../config/env.js";
import { appLogger } from "../config/logger.js";

class EmailService {
  constructor() {
    this.isDevelopment = config.isDevelopment;
    this.transporter = null;
    this.initialize();
  }

  initialize() {
    if (this.isDevelopment) {
      // В режиме разработки просто логируем
      appLogger.info("Email service initialized in DEVELOPMENT mode");
    } else {
      // В продакшене создаем реальный транспорт
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === "true",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      appLogger.info("Email service initialized in PRODUCTION mode");
    }
  }

  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${config.corsOrigin}/reset-password?token=${resetToken}`;

    if (this.isDevelopment) {
      // В режиме разработки логируем в консоль
      const devMessage = {
        to: user.email || user.username,
        subject: "Password Reset Request",
        resetUrl,
        token: resetToken,
        expiresIn: "30 minutes",
      };

      console.log("\n" + "=".repeat(80));
      console.log("[DEV] PASSWORD RESET EMAIL");
      console.log("=".repeat(80));
      console.log("To:", devMessage.to);
      console.log("Subject:", devMessage.subject);
      console.log("-".repeat(80));
      console.log("Reset Link:", devMessage.resetUrl);
      console.log("Token:", devMessage.token);
      console.log("Expires In:", devMessage.expiresIn);
      console.log("=".repeat(80) + "\n");

      appLogger.info(
        {
          recipient: devMessage.to,
          resetUrl: devMessage.resetUrl,
        },
        "Password reset email logged (DEV mode)"
      );

      return { success: true, mode: "development" };
    } else {
      // В продакшене отправляем реальное письмо
      const mailOptions = {
        from: process.env.SMTP_FROM || "noreply@chatapp.com",
        to: user.email,
        subject: "Password Reset Request",
        html: this.generatePasswordResetHtml(user.username, resetUrl),
        text: this.generatePasswordResetText(user.username, resetUrl),
      };

      try {
        const info = await this.transporter.sendMail(mailOptions);

        appLogger.info(
          {
            recipient: user.email,
            messageId: info.messageId,
          },
          "Password reset email sent"
        );

        return { success: true, mode: "production", messageId: info.messageId };
      } catch (error) {
        appLogger.error({ error }, "Failed to send password reset email");
        throw new Error("Failed to send password reset email");
      }
    }
  }

  generatePasswordResetHtml(username, resetUrl) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Password Reset Request</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi <strong>${username}</strong>,</p>
            
            <p>You requested to reset your password. Click the button below to reset it:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p>Or copy and paste this link into your browser:</p>
            <p style="background: white; padding: 10px; border-radius: 5px; word-break: break-all;">
              <a href="${resetUrl}" style="color: #667eea;">${resetUrl}</a>
            </p>
            
            <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
              <strong>Note:</strong> This link will expire in 30 minutes.
            </p>
            
            <p style="color: #666; font-size: 14px;">
              If you didn't request this password reset, please ignore this email or contact support if you have concerns.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© 2024 Chat Application. All rights reserved.</p>
          </div>
        </body>
      </html>
    `;
  }

  generatePasswordResetText(username, resetUrl) {
    return `
Hi ${username},

You requested to reset your password. Click the link below to reset it:

${resetUrl}

Note: This link will expire in 30 minutes.

If you didn't request this password reset, please ignore this email or contact support if you have concerns.

---
© 2024 Chat Application. All rights reserved.
    `.trim();
  }

  async sendWelcomeEmail(user) {
    if (this.isDevelopment) {
      console.log(
        `[DEV] Welcome email would be sent to: ${user.email || user.username}`
      );
      return { success: true, mode: "development" };
    }

    // Реализация отправки приветственного письма в продакшене
    // ...
  }
}

export default new EmailService();
