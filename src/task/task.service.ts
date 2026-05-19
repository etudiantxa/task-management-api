import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task, TaskStatus } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto'; // ← AJOUTER
import {
  NotificationsService,
  NotificationType,
} from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { Op } from 'sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task)
    private taskRepository: typeof Task,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  // ✨ Créer une tâche
  async create(user: any, dto: CreateTaskDto) {
    console.log(`📝 Création tâche pour user ${user.sub}`);

    const task = await this.taskRepository.create({
      title: dto.title,
      content: dto.content,
      priority: dto.priority?.toUpperCase(),
      status: dto.status || TaskStatus.TODO, // Définir le statut par défaut
      color: dto.color || 'blue',
      dueDate: dto.dueDate,
      userId: user.sub,
    } as any);

    console.log(`✅ Tâche créée : ${task.id}`);

    // ============================================================
    // 🔔 NOTIFICATIONS - VERSION AMÉLIORÉE
    // ============================================================

    // 1️⃣ NOTIFICATION POUR LE CRÉATEUR
    console.log(` McCart Notification pour créateur (user ${user.sub})`);
    await this.notificationsService.create(
      user.sub,
      task.id,
      NotificationType.TASK_CREATED,
      '✨ Nouvelle tâche créée',
      `Vous avez créé la tâche "${task.title}". Description: ${task.content}`,
    );

    // 2️⃣ NOTIFICATIONS POUR TOUS LES AUTRES UTILISATEURS
    try {
      console.log(` McCart Récupération de tous les utilisateurs...`);
      const allUsers = await this.usersService.findAll();
      console.log(` McCart ${allUsers.length} utilisateur(s) trouvé(s)`);

      for (const otherUser of allUsers) {
        // Ne pas notifier le créateur 2 fois
        if (otherUser.id !== user.sub) {
          console.log(` McCart Notification pour user ${otherUser.id}`);

          // Récupérer le nom du créateur
          const creator = await this.usersService.findOneById(user.sub);

          await this.notificationsService.create(
            otherUser.id,
            task.id,
            NotificationType.TASK_CREATED,
            '✨ Nouvelle tâche créée',
            `${creator.username} a créé la tâche "${task.title}". Description: ${task.content}`,
          );
        }
      }

      console.log(`✅ Toutes les notifications créées`);
    } catch (error) {
      console.error(
        `❌ Erreur création notifications pour autres users:`,
        error,
      );
      // Ne pas échouer si les notif échouent
    }

    // ============================================================

    return task;
  }

  // ✨ Récupérer toutes les tâches avec pagination
  async findAll(
    user: any,
    priority?: string,
    status?: string,
    limit: number = 10,
    offset: number = 0,
  ) {
    console.log(`📋 Récupération tâches pour user ${user.sub}`);

    const where: any = { userId: user.sub };
    if (priority) {
      where.priority = priority;
    }
    if (status) {
      where.status = status;
    }

    const { count, rows } = await this.taskRepository.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: Math.max(1, limit),
      offset: Math.max(0, offset),
    });

    const pagination = {
      total: count,
      limit,
      offset,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit),
      hasNextPage: offset + limit < count,
      hasPreviousPage: offset > 0,
    };

    return {
      tasks: rows,
      pagination,
    };
  }

  // ✨ Rechercher des tâches par titre
  async search(user: any, query: string) {
    console.log(`🔍 Recherche : "${query}" pour user ${user.sub}`);

    return this.taskRepository.findAll({
      where: {
        userId: user.sub,
        title: {
          [Op.like]: `%${query}%`,
        },
      },
      order: [['createdAt', 'DESC']],
    });
  }

  // ✨ Récupérer une tâche
  async findOne(id: number, userId: number) {
    console.log(`📄 Récupération tâche ${id}`);

    const task = await this.taskRepository.findOne({
      where: {
        id,
        userId,
      },
    });

    if (!task) {
      throw new NotFoundException('Tâche non trouvée');
    }

    return task;
  }

  // ✨ Mettre à jour une tâche
  async update(id: number, userId: number, dto: UpdateTaskDto) {
    // ← MODIFIER
    console.log(`✏️ Mise à jour tâche ${id}`);

    const task = await this.findOne(id, userId);

    const updatedTask = await task.update({
      title: dto.title || task.title,
      content: dto.content || task.content,
      priority: dto.priority?.toUpperCase() || task.priority,
      status: dto.status || task.status,
      color: dto.color || task.color,
      dueDate: dto.dueDate || task.dueDate,
    });
    
    // ============================================================
    // 🔔 NOTIFICATIONS - ENVOYER UNE NOTIFICATION QUAND UNE TÂCHE EST MISE À JOUR
    // ============================================================
    try {
      console.log(`🔔 Envoi notifications pour mise à jour tâche ${id}`);
      
      // 1️⃣ NOTIFICATION POUR LE PROPRIÉTAIRE DE LA TÂCHE
      console.log(
        ` McCart Notification mise à jour pour propriétaire (user ${userId})`,
      );
      await this.notificationsService.create(
        userId,
        task.id,
        NotificationType.TASK_UPDATED,
        '✏️ Tâche mise à jour',
        `Votre tâche "${updatedTask.title}" a été mise à jour. Description: ${updatedTask.content}`,
      );

      // 2️⃣ NOTIFICATIONS POUR TOUS LES AUTRES UTILISATEURS
      console.log(` McCart Récupération de tous les utilisateurs...`);
      const allUsers = await this.usersService.findAll();
      console.log(` McCart ${allUsers.length} utilisateur(s) trouvé(s)`);

      for (const otherUser of allUsers) {
        // Ne pas notifier le propriétaire de la tâche 2 fois
        if (otherUser.id !== userId) {
          console.log(
            ` McCart Notification mise à jour pour user ${otherUser.id}`,
          );

          // Récupérer le nom du propriétaire de la tâche
          const owner = await this.usersService.findOneById(userId);

          await this.notificationsService.create(
            otherUser.id,
            task.id,
            NotificationType.TASK_UPDATED,
            '✏️ Tâche mise à jour',
            `${owner.username} a mis à jour la tâche "${updatedTask.title}". Description: ${updatedTask.content}`,
          );
        }
      }

      console.log(`✅ Toutes les notifications de mise à jour envoyées`);
    } catch (error) {
      console.error(
        `❌ Erreur envoi notifications de mise à jour pour la tâche:`,
        error,
      );
      // Ne pas échouer si les notifications échouent
    }

    // ============================================================
    
    return updatedTask;
  }

  // ✨ Supprimer une tâche
  async remove(id: number, userId: number) {
    console.log(`🗑️ Suppression tâche ${id}`);

    const task = await this.findOne(id, userId);

    // 🔥 supprimer toutes les notifications liées à cette tâche
    await this.notificationsService.deleteByTaskId(id);

    // ensuite supprimer la tâche
    return task.destroy();
}

  // ✨ Obtenir les tâches en retard
  async findOverdue(userId: number) {
    console.log(`⏰ Récupération tâches en retard pour user ${userId}`);

    const now = new Date();
    return this.taskRepository.findAll({
      where: {
        userId,
        dueDate: {
          [Op.lt]: now,
        },
      },
      order: [['dueDate', 'ASC']],
    });
  }

  // ✨ Obtenir les tâches dues bientôt
  async findDueSoon(userId: number) {
    console.log(`📅 Récupération tâches dues bientôt pour user ${userId}`);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.taskRepository.findAll({
      where: {
        userId,
        dueDate: {
          [Op.between]: [now, tomorrow],
        },
      },
      order: [['dueDate', 'ASC']],
    });
  }
  
  // ✨ Tâche cron pour mettre à jour les tâches en retard
  @Cron(CronExpression.EVERY_HOUR) // Exécute toutes les heures
  async updateOverdueTasks() {
    console.log('🔄 Vérification des tâches en retard...');
    
    const now = new Date();
    
    // Trouver les tâches avec statut Todo ou InProgress qui sont en retard
    const overdueTasks = await this.taskRepository.findAll({
      where: {
        dueDate: {
          [Op.lt]: now,
        },
        status: {
          [Op.or]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
        }
      }
    });

    for (const task of overdueTasks) {
      console.log(
        `🔄 Mise à jour du statut de la tâche ${task.id} à "overdue"...`,
      );
      
      // Mettre à jour le statut de la tâche à "pending" pour indiquer qu'elle est en retard
      await task.update({ status: TaskStatus.PENDING });
      
      // Créer une notification pour informer l'utilisateur
      await this.notificationsService.create(
        task.userId,
        task.id,
        NotificationType.TASK_OVERDUE,
        '⏰ Tâche en retard',
        `La tâche "${task.title}" est en retard. Date d'échéance: ${task.dueDate}`
      );
    }
    
    console.log(`✅ ${overdueTasks.length} tâches potentiellement mises à jour.`);
  }
  
  // ✨ Tâche cron pour envoyer des notifications pour les tâches proches de leur échéance
  @Cron(CronExpression.EVERY_30_MINUTES) // Exécute toutes les 30 minutes
  async notifyUpcomingDeadlines() {
    console.log('🔔 Vérification des tâches avec échéance proche...');
    
    const now = new Date();
    const inTwoHours = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 heures à partir de maintenant
    
    // Trouver les tâches qui arriveront à échéance dans les prochaines 2 heures
    const upcomingTasks = await this.taskRepository.findAll({
      where: {
        dueDate: {
          [Op.between]: [now, inTwoHours],
        },
        status: {
          [Op.ne]: TaskStatus.COMPLETED // Ne pas notifier pour les tâches déjà terminées
        }
      }
    });

    for (const task of upcomingTasks) {
      console.log(`🔔 Envoi d'une notification pour la tâche ${task.id} avec échéance imminente...`);
      
      // Créer une notification pour informer l'utilisateur
      await this.notificationsService.create(
        task.userId,
        task.id,
        NotificationType.TASK_DEADLINE_APPROACHING,
        '⏰ Échéance imminente',
        `La tâche "${task.title}" arrive à échéance dans moins de 2 heures: ${task.dueDate}`
      );
    }
    
    console.log(`✅ ${upcomingTasks.length} notifications potentiellement envoyées.`);
  }
}