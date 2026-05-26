import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
  private resend: Resend;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.logger.log('Email service initialized with Resend');
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const data = await this.resend.emails.send({
        from: 'onboarding@resend.dev',
        to,
        subject,
        html: html || `<p>${text}</p>`,
      });
      this.logger.log(`Email sent: ${JSON.stringify(data)}`);
      return data;
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return null;
    }
  }
}