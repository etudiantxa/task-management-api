import {
  SequelizeModuleOptions,
  SequelizeOptionsFactory,
} from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig implements SequelizeOptionsFactory {
  constructor(private configService: ConfigService) {}

  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: (process.env.DB_DIALECT || 'postgres') as any,
      host: this.configService.get<string>('DB_HOST'),
      port: parseInt(this.configService.get<string>('DB_PORT'), 10) || 5432,
      username: this.configService.get<string>('DB_USERNAME'),
      password: this.configService.get<string>('DB_PASSWORD'),
      database: this.configService.get<string>('DB_NAME'),
      autoLoadModels: true,
      synchronize: process.env.NODE_ENV !== 'production', // Ne pas synchroniser en production
      logging: console.log,
    };
  }
}