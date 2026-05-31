import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: false, // Important : false pour le port 587
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    this.logger.log('Email service prêt avec Brevo SMTP');
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const info = await this.transporter.sendMail({
        from: `"TaskFlow Pro" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });
      this.logger.log(`Email de réinitialisation envoyé à : ${to}`);
      return info;
    } catch (error) {
      this.logger.error(`Erreur d'envoi SMTP : ${error.message}`);
      return null;
    }
  }
}