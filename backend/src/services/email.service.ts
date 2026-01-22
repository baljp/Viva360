import nodemailer from 'nodemailer';
import { queueEmail } from '../config/queue';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASS || 'pass',
      },
      pool: true,
      maxConnections: 5,
      maxMessages: 100,
    });
  }

  /**
   * Queue an email for async sending (recommended for non-critical emails)
   */
  async sendEmail(to: string, subject: string, html: string, priority?: 'high' | 'normal' | 'low') {
    if (process.env.NODE_ENV === 'test') return;
    
    // Queue for async processing
    try {
      if (process.env.REDIS_URL) {
        await queueEmail({ to, subject, html, priority });
        console.log(`📬 Email queued: ${subject} -> ${to}`);
        return;
      }
    } catch (e) {
      console.warn('Queue unavailable, sending directly');
    }
    
    // Fallback to direct send
    await this.sendEmailDirect(to, subject, html);
  }

  /**
   * Send email directly (synchronous, used by queue worker)
   */
  async sendEmailDirect(to: string, subject: string, html: string) {
    if (process.env.NODE_ENV === 'test') return;
    
    try {
      const info = await this.transporter.sendMail({
        from: `"Viva360" <${process.env.EMAIL_FROM || 'noreply@viva360.com'}>`,
        to,
        subject,
        html,
      });
      console.log('✅ Email sent:', info.messageId);
      return info;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Mock Email (Dev Mode):');
        console.log('   To:', to);
        console.log('   Subject:', subject);
        return;
      }
      throw error;
    }
  }

  /**
   * Send critical email synchronously (bypasses queue)
   */
  async sendCriticalEmail(to: string, subject: string, html: string) {
    return this.sendEmailDirect(to, subject, html);
  }
}

export const emailService = new EmailService();
