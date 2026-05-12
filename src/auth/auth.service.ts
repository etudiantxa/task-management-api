import { Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from 'src/users/users.service';
import { LoginRequest } from './dtos/login-request.dt';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { jwtConstants } from './utils/constant';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { UpdateUserRequestDto } from './dtos/update-auth-request.dto';
import {
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dtos/forgot-reset-password.dto';
import { EmailService } from '../email/email.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID ||
      '1001312901323-lc814c59bk011tpu982gl6e7vkm3f8lr.apps.googleusercontent.com',
  );
  // Variable temporaire pour stocker le dernier jeton de réinitialisation
  private lastResetToken: string | null = null;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private emailService: EmailService,
  ) {}

  async googleLogin(idToken: string) {
    try {
      // ✨ 1. NETTOYAGE DU JETON
      // Supprime les espaces et les retours à la ligne invisibles (fréquents lors du copier-coller depuis le terminal)
      const cleanToken = idToken.trim().replace(/\n/g, '').replace(/\r/g, '');

      // ✨ 2. VÉRIFICATION CHEZ GOOGLE
      const ticket = await this.googleClient.verifyIdToken({
        idToken: cleanToken,
        audience:
          process.env.GOOGLE_CLIENT_ID ||
          '1001312901323-lc814c59bk011tpu982gl6e7vkm3f8lr.apps.googleusercontent.com',
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new UnauthorizedException('Jeton Google vide ou corrompu');
      }
      // Extraction des infos Google
      const { email, family_name, given_name, picture, sub } = payload;

      // ✨ 3. GESTION DE L'UTILISATEUR DANS SQLITE
      // On cherche si l'utilisateur existe déjà avec cet email
      let user = await this.usersService.findByEmail(email);

      if (!user) {
        console.log(
          `Utilisateur inexistant. Création du compte pour : ${email}`,
        );

        // Création automatique si c'est sa première connexion
        user = await this.usersService.create({
          email: email,
          nom: family_name || '',
          prenom: given_name || '',
          username: email.split('@')[0], // On prend le début de l'email comme username par défaut
          password: sub, // On utilise l'ID unique Google comme password (sera haché par votre service)
          photo: picture,
        });
      } else {
        console.log(`Utilisateur trouvé : ${user.username}`);
      }

      // ✨ 4. GÉNÉRATION DU TOKEN TASKFLOW (JWT)
      // On crée une session locale pour votre application Flutter
      const jwtPayload = { 
        username: user.username, 
        sub: user.id 
      };

      return {
        token: this.jwtService.sign(jwtPayload),
        user: user, // On renvoie les infos complètes de l'utilisateur
      };

    } catch (error) {
      // On affiche l'erreur réelle dans le terminal pour vous aider
      console.error('❌ ERREUR GOOGLE LOGIN :', error.message);

      throw new UnauthorizedException(
        `Authentification échouée : ${error.message}`,
      );
    }
  }


  async register(user: RegisterRequestDto) {
    return this.usersService.create(user);
  }

  async validateUser(data: LoginRequest): Promise<any> {
    try {
      const user = await this.usersService.findOne(data.username);
      if (!user) {
        console.log(`❌ Utilisateur non trouvé: ${data.username}`);
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        user.password,
      );
      if (!isPasswordValid) {
        console.log(
          `❌ Mot de passe incorrect pour l'utilisateur: ${data.username}`,
        );
        return null;
      }

      console.log(`✅ Utilisateur authentifié: ${data.username}`);
      return user;
    } catch (error) {
      console.error(`❌ Erreur lors de la validation de l'utilisateur:`, error);
      return null;
    }
  }

  async signIn(data: LoginRequest): Promise<any> {
    try {
      const user = await this.validateUser(data);
      if (user) {
        return this.getJwt(user);
      } else {
        throw new UnauthorizedException(
          "Nom d'utilisateur ou mot de passe incorrect",
        );
      }
    } catch (error) {
      console.error('❌ Erreur lors de la connexion:', error);
      throw error;
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const user = this.jwtService.verify(refreshToken, {
        secret: jwtConstants.secret,
      });
      return this.getJwt(user);
    } catch (e) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateUser(token: string, updateUserRequestDto: UpdateUserRequestDto) {
    try {
      const user = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });
      return this.usersService.update(user.sub, updateUserRequestDto);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async getUser(token: string) {
    try {
      const user = this.jwtService.verify(token, {
        secret: jwtConstants.secret,
      });
      return this.usersService.findById(user.sub);
    } catch (e) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  generateRefreshToken(user: any) {
    const payload = { username: user.username, sub: user.id };
    return this.jwtService.sign(payload, {
      secret: jwtConstants.secret,
      expiresIn: '7d', // Refresh token expires in 7 days
    });
  }

  getJwt(user: any) {
    const payload = { sub: user.id, username: user.username };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: jwtConstants.secret,
        expiresIn: '7d',
      }),
      refresh_token: this.generateRefreshToken(user),
    };
  }
  
  // Méthode pour récupérer le dernier jeton de réinitialisation (uniquement pour les tests)
  getLastResetToken(): string | null {
    return this.lastResetToken;
  }
  
  // Demande de réinitialisation
  async forgotPassword(dto: ForgotPasswordDto) {
    // Utiliser findByEmail au lieu de findOne (qui cherche par username)
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Pour la sécurité, ne pas révéler si l'email existe
      return {
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      };
    }
    // Générer un token unique (JWT)
    const token = this.jwtService.sign(
      { sub: user.id },
      {
        secret: jwtConstants.secret,
        expiresIn: '1h',
      },
    );
    
    // Stocker temporairement le jeton pour les tests
    this.lastResetToken = token;
    
    // Envoyer l'email
    const resetUrl = `http://localhost:3000/reset-password?token=${token}`;
    await this.emailService.sendMail(
      user.email,
      'Réinitialisation de votre mot de passe',
      `Cliquez sur ce lien pour réinitialiser votre mot de passe : ${resetUrl}`,
      `<p>Cliquez sur ce lien pour réinitialiser votre mot de passe : <a href="${resetUrl}">${resetUrl}</a></p>`,
    );
    return {
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    };
}

  // Réinitialisation du mot de passe
  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.token, {
        secret: jwtConstants.secret,
      });
    } catch (e) {
      throw new BadRequestException('Token invalide ou expiré');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
  }
    // Mettre à jour le mot de passe (laisser le service utilisateur le hasher)
    await this.usersService.update(user.id, { password: dto.newPassword });
    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}