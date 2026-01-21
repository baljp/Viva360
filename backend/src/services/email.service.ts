import nodemailer from 'nodemailer';

export class EmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.ethereal.email',
      port: Number(process.env.SMTP_PORT) || 587,
      auth: {
        user: process.env.SMTP_USER || 'user',
        pass: process.env.SMTP_PASS || 'pass',
      },
    });
  }

  async sendEmail(to: string, subject: string, html: string) {
    if (process.env.NODE_ENV === 'test') return;
    
    try {
      // In development with mocked creds, this might fail unless using real Ethereal creds
      // If fails, we just log the content
      const info = await this.transporter.sendMail({
        from: '"Viva360" <noreply@viva360.com>',
        to,
        subject,
        html,
      });
      console.log('Message sent: %s', info.messageId);
    } catch (error) {
      console.log('Mock Email Sent (Simulated):');
      console.log('To:', to);
      console.log('Subject:', subject);
      console.log('Content:', html);
    }
  }
}

export const emailService = new EmailService();
