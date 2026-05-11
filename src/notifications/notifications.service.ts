import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notification } from './entities/notification.entity';

export enum NotificationType {
  TASK_CREATED = 'TASK_CREATED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_DELETED = 'TASK_DELETED',
  TASK_OVERDUE = 'TASK_OVERDUE',
  TASK_DEADLINE_APPROACHING = 'TASK_DEADLINE_APPROACHING',
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification)
    private notificationRepository: typeof Notification,
  ) {}

  // ✨ Créer une notification
  async create(
    userId: number,
    taskId: number,
    type: NotificationType,
    title: string,
    content: string,
  ) {
    console.log(`🔔 Création notification pour user ${userId}`);
    console.log(`📋 Type: ${type} | ${title}`);

    return this.notificationRepository.create({
      userId,
      taskId,
      type,
      title,
      content, // Utiliser directement le champ content
      isRead: false,
    });
  }

  // ✨ Récupérer les notifications d'un utilisateur
  async findAll(userId: number) {
    console.log(`📋 Récupération notifications pour user ${userId}`);

    return this.notificationRepository.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']],
    });
  }

  // ✨ Récupérer une notification
  async findOne(id: number, userId: number) {
    console.log(`📄 Récupération notification ${id}`);

    const notification = await this.notificationRepository.findOne({
      where: {
        id,
        userId,
      },
    });
    
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    
    return notification;
  }

  // ✨ Récupérer les notifications non lues d'un utilisateur
  async findUnread(userId: number) {
    console.log(`📋 Récupération notifications non lues pour user ${userId}`);

    return this.notificationRepository.findAll({
      where: { userId, isRead: false },
      order: [['createdAt', 'DESC']],
    });
  }

  // ✨ Marquer une notification comme lue
  async markAsRead(id: number, userId: number) {
    console.log(`👁️ Marquage notification ${id} comme lue`);

    const notification = await this.findOne(id, userId);
    return notification.update({ isRead: true });
  }

  // ✨ Marquer toutes les notifications comme lues
  async markAllAsRead(userId: number) {
    console.log(`👁️ Marquage de toutes les notifications comme lues pour user ${userId}`);

    return this.notificationRepository.update(
      { isRead: true },
      { where: { userId } },
    );
  }

  // ✨ Nombre de notifications non lues
  async countUnread(userId: number) {
    console.log(`🔢 Comptage notifications non lues pour user ${userId}`);

    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  // ✨ Supprimer une notification
  async remove(id: number, userId: number) {
    console.log(` McCart Suppression notification ${id}`);

    const notification = await this.findOne(id, userId);
    return notification.destroy();
  }

  // ✨ Supprimer les notifications liées à une tâche
  async deleteByTaskId(taskId: number) {
    console.log(` McCart Suppression notifications pour tâche ${taskId}`);

    return this.notificationRepository.destroy({
      where: { taskId },
    });
  }
}