import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false, // false pour le port 587, true pour le port 465
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // Ajout d'options de connexion pour gérer les timeouts
      connectionTimeout: 60000, // 60 secondes
      greetingTimeout: 30000,   // 30 secondes
      socketTimeout: 60000,     // 60 secondes
      tls: {
        rejectUnauthorized: false, // Accepter les certificats auto-signés si nécessaire
      },
    });
    
    // Vérifier que les variables d'environnement sont définies
    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      this.logger.warn('Les variables SMTP ne sont pas toutes définies dans l\'environnement');
    } else {
      this.logger.log('Email service prêt avec Brevo SMTP');
    }
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
      this.logger.log(`Email de réinitialisation envoyé à : ${to}. Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`Erreur d'envoi SMTP : ${error.message}`);
      // Log des détails supplémentaires pour le débogage
      this.logger.error(`Détails: Host=${process.env.SMTP_HOST}, Port=${process.env.SMTP_PORT}, User=${process.env.SMTP_USER}`);
      return null;
    }
  }
}