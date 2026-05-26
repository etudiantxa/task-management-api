import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    // Pour le développement, on peut utiliser Gmail ou un SMTP de test
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // votre adresse Gmail
        pass: process.env.EMAIL_PASS, // mot de passe d'application Gmail
      },
    });

    // Vérifier si les identifiants sont bien chargés
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      this.logger.warn(
        'EMAIL_USER or EMAIL_PASS not set in environment variables',
      );
    } else {
      this.logger.log(
        'Email service initialized with user: ' + process.env.EMAIL_USER,
      );
    }
  }

  async sendMail(to: string, subject: string, text: string, html?: string) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(
        `Email sent successfully to: ${to}. Message ID: ${info.messageId}`,
      );
      return info;
    } catch (error) {
      // En cas d'erreur d'envoi d'email, on loggue l'erreur mais on ne la propage pas
      this.logger.error(`Failed to send email: ${error.message}`);

      // Pour les tests, on envoie le contenu dans les logs
      this.logger.log(
        `Email would have contained: To: ${to}, Subject: ${subject}, Content: ${text}`
      );

      // IMPORTANT: Ne pas propager l'erreur pour permettre la suite du processus de réinitialisation
      // L'utilisateur ne recevra pas l'email, mais le processus continuera
      return null;
    }
  }
}