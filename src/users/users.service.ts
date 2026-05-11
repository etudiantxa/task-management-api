import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './entities/user.entity';
import { RegisterRequestDto } from 'src/auth/dtos/register-request.dto';
import { UpdateUserRequestDto } from 'src/auth/dtos/update-auth-request.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private userRepository: typeof User,
  ) {}

  // ✨ Récupérer un utilisateur par USERNAME
  async findOne(username: string): Promise<User | undefined> {
    if (!username) {
      return undefined;
    }
    return this.userRepository.findOne({ where: { username } });
  }

  // ✨ NOUVELLE MÉTHODE - Récupérer un utilisateur par EMAIL
  async findByEmail(email: string): Promise<User | undefined> {
    if (!email) {
      return undefined;
    }
    return this.userRepository.findOne({ where: { email } });
  }

  // ✨ NOUVELLE MÉTHODE - Récupérer un utilisateur par ID (pour notifications)
  async findOneById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({
      where: { id },
      attributes: ['id', 'username', 'email', 'createdAt'],
    });
  }

  // ✨ NOUVELLE MÉTHODE - Récupérer TOUS les utilisateurs (pour notifications)
  async findAll() {
    console.log(`👥 Récupération de tous les utilisateurs`);
    return this.userRepository.findAll({
      attributes: ['id', 'username', 'email', 'createdAt'],
      order: [['createdAt', 'DESC']],
    });
  }

  // ✨ Créer un utilisateur
  async create(user: RegisterRequestDto) {
    if (!user.username) {
      throw new BadRequestException('Username is required');
    }
    
    const findUser = await this.findOne(user.username);

    if (findUser != undefined && findUser != null) {
      throw new BadRequestException(
        'A user with the username ' + user.username + ' already exists',
      );
    }
    
    // Create a new user object with only the properties that are needed
    const userData = {
      username: user.username,
      email: user.email || null,
      password: user.password,
      nom: user.nom,
      prenom: user.prenom,
      photo: user.photo || null
    };

    return this.userRepository.create(userData);
  }

  // ✨ Mettre à jour un utilisateur
  async update(id: number, updateUserDto: UpdateUserRequestDto) {
    const condition = { where: { id: id } };
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    this.userRepository.update(updateUserDto as any, condition);
    return this.userRepository.findOne({ where: { id } });
  }

  // ✨ Récupérer un utilisateur par ID (ancien nom, utilisé ailleurs dans le code)
  async findById(id: number) {
    return this.userRepository.findOne({ where: { id } });
  }
}