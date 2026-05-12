import { SequelizeModuleOptions, SequelizeOptionsFactory } from '@nestjs/sequelize';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseConfig implements SequelizeOptionsFactory {
  createSequelizeOptions(): SequelizeModuleOptions {
    return {
      dialect: 'sqlite',
      storage: process.env.DB_STORAGE || '.db/data.sqlite3',
      autoLoadModels: true,
      synchronize: process.env.NODE_ENV !== 'production', // Ne pas synchroniser en production
    };
  }
}