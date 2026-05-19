import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TaskModule } from './task/task.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { DatabaseConfig } from './database.config';
import { ScheduleModule } from '@nestjs/schedule';
import { NotificationsModule } from './notifications/notifications.module';
import { EmailModule } from './email/email.module'; // Importer le module Email
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    // Charger ScheduleModule sans options pour éviter les problèmes avec crypto.randomUUID()
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    SequelizeModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
    TaskModule,
    UsersModule,
    AuthModule,
    NotificationsModule,
    EmailModule, // Ajouter le module Email

  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}