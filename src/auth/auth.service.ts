import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { RegisterRequestDto } from './dtos/register-request.dto';
import { UpdateUserRequestDto } from './dtos/update-auth-request.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginRequest } from './dtos/login-request.dt';
import { EmailService } from '../email/email.service';
import { OAuth2Client } from 'google-auth-library';
import { ForgotPasswordDto } from './dtos/forgot-reset-password.dto';
import { ResetPasswordDto } from './dtos/forgot-reset-password.dto';
import { User } from '../users/entities/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Express } from 'express';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleOAuth2Client: OAuth2Client;
  private resetTokens: Map<string, { userId: number; expiresAt: Date }> =
    new Map();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private emailService: EmailService,
  ) {
    // Initialiser le client Google OAuth2
    this.googleOAuth2Client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  }

  async signIn(loginRequest: LoginRequest) {
    const { username, password } = loginRequest;
    // Utiliser la méthode findOne au lieu de findByUsername
    const user = await this.usersService.findOne(username);

    if (!user) {
      throw new UnauthorizedException(
        "Nom d'utilisateur ou mot de passe incorrect",
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        "Nom d'utilisateur ou mot de passe incorrect",
      );
    }

    const payload: JwtPayload = { sub: user.id, username: user.username };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        photo: user.photo,
      },
    };
  }

  async register(user: RegisterRequestDto) {
    const newUser = await this.usersService.create(user);
    
    const payload: JwtPayload = { sub: newUser.id, username: newUser.username };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        nom: newUser.nom,
        prenom: newUser.prenom,
        photo: newUser.photo,
      },
    };
  }

  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleOAuth2Client.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();

      // Logique pour créer ou trouver un utilisateur avec Google
      let user = await this.usersService.findByEmail(payload.email);

      if (!user) {
        // Créer un nouvel utilisateur avec les données Google
        user = await this.usersService.create({
          username: payload.email.split('@')[0],
          email: payload.email,
          password: '', // Mot de passe vide pour les comptes Google
          nom: payload.family_name || '',
          prenom: payload.given_name || '',
          photo: payload.picture || '',
        });
      }

      const jwtPayload: JwtPayload = { sub: user.id, username: user.username };
      return {
        access_token: await this.jwtService.signAsync(jwtPayload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          photo: user.photo,
        },
      };
    } catch (error) {
      this.logger.error(`Erreur d'authentification Google: ${error.message}`);
      throw new UnauthorizedException("Erreur d'authentification Google");
    }
  }

  async refreshAccessToken(refreshToken: string) {
    try {
      const decoded = await this.jwtService.decode(refreshToken);
      const user = await this.usersService.findById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      const payload: JwtPayload = { sub: user.id, username: user.username };
      return {
        access_token: await this.jwtService.signAsync(payload),
      };
    } catch (error) {
      this.logger.error(`Erreur de rafraîchissement du token: ${error.message}`);
      throw new UnauthorizedException('Erreur de rafraîchissement du token');
    }
  }

  async updateUser(jwt: string, updateData: UpdateUserRequestDto) {
    try {
      const decoded = await this.jwtService.verifyAsync(jwt);
      const user = await this.usersService.findById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException("L'utilisateur n'existe pas");
      }

      // Vérifier si l'email est modifié et s'il est déjà utilisé
      if (updateData.email && updateData.email !== user.email) {
        const emailExists = await this.usersService.findByEmail(updateData.email);
        if (emailExists) {
          throw new UnauthorizedException("Cet email est déjà utilisé par un autre utilisateur");
        }
      }

      // Mettre à jour les données de l'utilisateur
      const updatedUser = await this.usersService.update(user.id, {
        ...updateData,
      });

      return {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          nom: updatedUser.nom,
          prenom: updatedUser.prenom,
          photo: updatedUser.photo,
        },
        message: 'Profil mis à jour avec succès',
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour du profil: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de la mise à jour du profil");
    }
  }

  async updateUserPhoto(jwt: string, file: Express.Multer.File) {
    try {
      const decoded = await this.jwtService.verifyAsync(jwt);
      const user = await this.usersService.findById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException("L'utilisateur n'existe pas");
      }

      // Vérifier que le fichier est une image
      if (!file.mimetype.startsWith('image/')) {
        throw new UnauthorizedException("Format de fichier non supporté. Veuillez télécharger une image.");
      }

      // Mettre à jour la photo de l'utilisateur
      // Ici, vous pouvez soit stocker le chemin vers l'image, soit encoder l'image en base64
      const photoPath = `/uploads/profile-pics/${file.filename}`;
      
      const updatedUser = await this.usersService.update(user.id, {
        photo: photoPath,
      });

      return {
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          nom: updatedUser.nom,
          prenom: updatedUser.prenom,
          photo: updatedUser.photo,
        },
        message: 'Photo de profil mise à jour avec succès',
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la mise à jour de la photo de profil: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de la mise à jour de la photo de profil");
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      // Retourner un message générique pour des raisons de sécurité
      return { message: "Si cet email existe, un lien de réinitialisation a été envoyé." };
    }

    // Générer un token de réinitialisation
    const payload = { sub: user.id, email: user.email, iat: Math.floor(Date.now() / 1000) };
    const token = await this.jwtService.signAsync(payload, { expiresIn: '1h' });

    // Stocker temporairement le token (en production, utiliser une base de données ou Redis)
    this.resetTokens.set(token, { 
      userId: user.id, 
      expiresAt: new Date(Date.now() + 60 * 60 * 1000) // 1 heure
    });

    // Envoyer l'email de réinitialisation
    try {
      await this.emailService.sendMail(
        dto.email,
        'Réinitialisation de votre mot de passe',
        `Cliquez sur ce lien pour réinitialiser votre mot de passe : http://localhost:3000/reset-password?token=${token}`
      );
    } catch (error) {
      // En mode développement, nous pouvons enregistrer l'erreur sans arrêter le processus
      this.logger.error(`Erreur lors de l'envoi de l'email: ${error.message}`);
    }

    return { message: "Si cet email existe, un lien de réinitialisation a été envoyé." };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const tokenInfo = this.resetTokens.get(dto.token);
    
    if (!tokenInfo || tokenInfo.expiresAt < new Date()) {
      throw new UnauthorizedException('Token invalide ou expiré');
    }

    // Mettre à jour le mot de passe de l'utilisateur
    // Le service users se chargera de hasher le mot de passe
    await this.usersService.update(tokenInfo.userId, { password: dto.newPassword });

    // Supprimer le token utilisé
    this.resetTokens.delete(dto.token);

    return { message: 'Mot de passe réinitialisé avec succès' };
  }

  getLastResetToken() {
    const tokens = Array.from(this.resetTokens.keys());
    return tokens[tokens.length - 1];
  }

  async getUser(jwt: string) {
    try {
      const decoded = await this.jwtService.verifyAsync(jwt);
      const user = await this.usersService.findById(decoded.sub);

      if (!user) {
        throw new UnauthorizedException("L'utilisateur n'existe pas");
      }

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        nom: user.nom,
        prenom: user.prenom,
        photo: user.photo,
      };
    } catch (error) {
      this.logger.error(`Erreur lors de la récupération du profil: ${error.message}`);
      throw new InternalServerErrorException("Erreur lors de la récupération du profil");
    }
  }
}