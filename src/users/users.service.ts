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

  async findOne(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username } });
  }

  async create(user: RegisterRequestDto) {
    const  findUser =  await this.findOne(user.username);

    if (findUser != undefined || findUser != null) {
      throw new BadRequestException(
        'A user with the username ' + user.username + ' already exists',
      );
    }
    return this.userRepository.create(user as any);
  }

  async update(id: number, updateUserDto: UpdateUserRequestDto) {
    const condition = { where: { id: id } };
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    this.userRepository.update(updateUserDto as any, condition);
    return this.userRepository.findOne({ where: { id } });
  }
}
