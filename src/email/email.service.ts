import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor() {
    this.initTransporter();
  }

  private initTransporter() {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT) || 465;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    // Log de la config au démarrage pour vérifier les valeurs réelles
    this.logger.log(
      `Initialisation SMTP => host:${host} | port:${port} | user:${user}`,
    );

    if (!host || !user || !pass) {
      this.logger.warn(
        "⚠️  Variables SMTP manquantes — vérifiez SMTP_HOST, SMTP_USER, SMTP_PASS dans votre .env",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,   // true pour 465 (SSL), false pour 587/2525 (STARTTLS)
      auth: { user, pass },
      connectionTimeout: 60_000,
      greetingTimeout: 30_000,
      socketTimeout:   60_000,
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Vérifie la connexion SMTP (utile au démarrage ou pour un health-check)
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Connexion SMTP vérifiée avec succès');
      return true;
    } catch (error) {
      this.logger.error(`❌ Échec de la vérification SMTP : ${error.message}`);
      this.logger.error(
        `Détails: Host=${process.env.SMTP_HOST}, Port=${process.env.SMTP_PORT}, User=${process.env.SMTP_USER}`,
      );
      return false;
    }
  }

  /**
   * Envoie un email
   */
  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<nodemailer.SentMessageInfo | null> {
    try {
      const info = await this.transporter.sendMail({
        from: `"TaskFlow Pro" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });

      this.logger.log(`✅ Email envoyé à ${to} — Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      this.logger.error(`❌ Erreur d'envoi SMTP : ${error.message}`);
      this.logger.error(
        `Détails: Host=${process.env.SMTP_HOST}, Port=${process.env.SMTP_PORT}, User=${process.env.SMTP_USER}`,
      );
      return null;
    }
  }

  /**
   * Email de réinitialisation de mot de passe
   */
  async sendPasswordReset(to: string, resetLink: string): Promise<boolean> {
    const subject = 'Réinitialisation de votre mot de passe — TaskFlow Pro';
    const text = `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetLink}\n\nCe lien expire dans 1 heure.`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Réinitialisation de mot de passe</h2>
        <p>Vous avez demandé une réinitialisation de votre mot de passe.</p>
        <p>
          <a href="${resetLink}"
             style="display:inline-block; padding:12px 24px; background:#4F46E5;
                    color:#fff; text-decoration:none; border-radius:6px;">
            Réinitialiser mon mot de passe
          </a>
        </p>
        <p style="color:#6B7280; font-size:14px;">
          Ce lien expire dans <strong>1 heure</strong>.<br/>
          Si vous n'avez pas fait cette demande, ignorez cet email.
        </p>
      </div>
    `;

    const result = await this.sendMail(to, subject, text, html);
    return result !== null;
  }

  /**
   * Email de bienvenue
   */
  async sendWelcome(to: string, username: string): Promise<boolean> {
    const subject = 'Bienvenue sur TaskFlow Pro !';
    const text = `Bonjour ${username}, votre compte a bien été créé. Bonne productivité !`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Bienvenue, ${username} 👋</h2>
        <p>Votre compte <strong>TaskFlow Pro</strong> a bien été créé.</p>
        <p>Vous pouvez dès maintenant vous connecter et gérer vos tâches.</p>
        <p style="color:#6B7280; font-size:14px;">L'équipe TaskFlow Pro</p>
      </div>
    `;

    const result = await this.sendMail(to, subject, text, html);
    return result !== null;
  }
}