import { Module } from '@nestjs/common';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Task } from './entities/task.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';
import { TaskAssignment } from './entities/task-assignment.entity';

@Module({
  imports: [
    SequelizeModule.forFeature([Task, Notification, User, TaskAssignment]), // Ajout de TaskAssignment
  ],
  controllers: [TaskController],
  providers: [TaskService, NotificationsService, UsersService],
})
export class TaskModule {}