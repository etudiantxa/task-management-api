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

  /**
   * Envoie un email
   */
  async sendMail(
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<any> {
    try {
      const data = await this.resend.emails.send({
        from: 'onboarding@resend.dev', // domaine par défaut Resend
        to,
        subject,
        html: html || `<p>${text}</p>`,
      });
      
      if (data.error) {
        this.logger.error(`❌ Erreur d'envoi d'email : ${data.error.message}`);
        return null;
      }
      
      this.logger.log(`✅ Email envoyé à ${to} — Message ID: ${data.data.id}`);
      return data;
    } catch (error) {
      this.logger.error(`❌ Erreur d'envoi d'email : ${error.message}`);
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