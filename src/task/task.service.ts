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
import { Op, Sequelize } from 'sequelize';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TaskAssignment } from './entities/task-assignment.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task)
    private taskRepository: typeof Task,
    @InjectModel(TaskAssignment)
    private taskAssignmentRepository: typeof TaskAssignment,
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

    // Gérer les assignations d'utilisateurs
    if (dto.assignedUserIds && Array.isArray(dto.assignedUserIds)) {
      await this.assignUsersToTask(task.id, dto.assignedUserIds);
    }

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

    // 2️⃣ NOTIFICATIONS POUR LES UTILISATEURS ASSIGNÉS
    try {
      console.log(` McCart Récupération des utilisateurs assignés...`);
      
      // Récupérer les utilisateurs assignés à cette tâche
      const assignedUsers = await this.getAssignedUsers(task.id);
      console.log(` McCart ${assignedUsers.length} utilisateur(s) assigné(s) trouvé(s)`);

      for (const assignedUser of assignedUsers) {
        // Ne pas notifier le créateur s'il est aussi assigné
        if (assignedUser.id !== user.sub) {
          console.log(` McCart Notification pour utilisateur assigné ${assignedUser.id}`);

          // Récupérer le nom du créateur
          const creator = await this.usersService.findOneById(user.sub);

          await this.notificationsService.create(
            assignedUser.id,
            task.id,
            NotificationType.TASK_CREATED,
            '✨ Tâche vous est assignée',
            `${creator.username} vous a assigné(e) à la tâche "${task.title}". Description: ${task.content}`,
          );
        }
      }

      console.log(`✅ Toutes les notifications envoyées`);
    } catch (error) {
      console.error(
        `❌ Erreur création notifications pour les utilisateurs assignés:`,
        error,
      );
      // Ne pas échouer si les notif échouent
    }

    // ============================================================

    return task;
  }

  // Fonction pour assigner des utilisateurs à une tâche
  async assignUsersToTask(taskId: number, userIds: number[]) {
    console.log(` McCart Assignation des utilisateurs ${userIds.join(', ')} à la tâche ${taskId}`);
    
    // D'abord supprimer les anciennes assignations pour cette tâche
    await this.taskAssignmentRepository.destroy({
      where: { taskId }
    });

    // Créer les nouvelles assignations
    for (const userId of userIds) {
      await this.taskAssignmentRepository.create({
        taskId,
        userId,
        role: 'assigned' // Par défaut, tous les utilisateurs sont assignés à la tâche
      });
    }
    
    console.log(`✅ ${userIds.length} utilisateur(s) assigné(s) à la tâche ${taskId}`);
  }

  // Fonction pour récupérer les utilisateurs assignés à une tâche
  async getAssignedUsers(taskId: number) {
    const assignments = await this.taskAssignmentRepository.findAll({
      where: { taskId }
    });

    // Récupérer les utilisateurs séparément
    const userIds = assignments.map(assignment => assignment.userId);
    const users = [];
    
    for (const userId of userIds) {
      try {
        const user = await this.usersService.findOneById(userId);
        if (user) users.push(user);
      } catch (error) {
        console.error(
          `Erreur lors de la récupération de l'utilisateur ${userId}:`,
          error,
        );
      }
    }
    
    return users;
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

    // Récupérer d'abord les tâches appartenant à l'utilisateur
    const userTaskIds = await this.taskRepository.findAll({
      where: { userId: user.sub },
      attributes: ['id'],
      raw: true
    }).then(tasks => tasks.map(t => t.id));

    // Récupérer les IDs des tâches où l'utilisateur est assigné
    const assignedTaskIds = await this.taskAssignmentRepository.findAll({
      where: { userId: user.sub },
      attributes: ['taskId'],
      raw: true
    }).then(assignments => assignments.map(a => a.taskId));

    // Combiner les IDs des tâches (soit propriétaires, soit assignées)
    const allTaskIds = [...new Set([...userTaskIds, ...assignedTaskIds])]; // Union avec dédoublonnage

    if (allTaskIds.length === 0) {
      // Si l'utilisateur n'a ni tâches propres ni tâches assignées, renvoyer une réponse vide
      return {
        tasks: [],
        pagination: {
          total: 0,
          limit,
          offset,
          page: Math.floor(offset / limit) + 1,
          totalPages: 0,
          hasNextPage: false,
          hasPreviousPage: offset > 0,
        }
      };
    }

    // Construire la condition WHERE pour filtrer par ID
    const whereCondition: any = {
      id: { [Op.in]: allTaskIds }
    };

    // Appliquer les filtres additionnels
    if (priority) {
      whereCondition.priority = priority;
    }
    if (status) {
      whereCondition.status = status;
    }

    // Effectuer la requête finale avec pagination
    const { count, rows } = await this.taskRepository.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: TaskAssignment,
          required: false,
        }
      ],
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

    // Récupérer d'abord les tâches appartenant à l'utilisateur
    const userTaskIds = await this.taskRepository.findAll({
      where: { userId: user.sub },
      attributes: ['id'],
      raw: true
    }).then(tasks => tasks.map(t => t.id));

    // Récupérer les IDs des tâches où l'utilisateur est assigné
    const assignedTaskIds = await this.taskAssignmentRepository.findAll({
      where: { userId: user.sub },
      attributes: ['taskId'],
      raw: true
    }).then(assignments => assignments.map(a => a.taskId));

    // Combiner les IDs des tâches (soit propriétaires, soit assignées)
    const allTaskIds = [...new Set([...userTaskIds, ...assignedTaskIds])]; // Union avec dédoublonnage

    if (allTaskIds.length === 0) {
      // Si l'utilisateur n'a ni tâches propres ni tâches assignées, renvoyer une réponse vide
      return [];
    }

    // Filtrer les tâches par titre en utilisant les IDs combinés
    return this.taskRepository.findAll({
      where: {
        id: { [Op.in]: allTaskIds },
        title: {
          [Op.like]: `%${query}%`,
        },
      },
      include: [
        {
          model: TaskAssignment,
          required: false,
        }
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  // ✨ Récupérer une tâche
  async findOne(id: number, userId: number) {
    console.log(`📄 Récupération tâche ${id}`);

    // Vérifier si la tâche appartient à l'utilisateur
    const userTaskIds = await this.taskRepository.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true
    }).then(tasks => tasks.map(t => t.id));

    // Vérifier si l'utilisateur est assigné à cette tâche
    const assignedTaskIds = await this.taskAssignmentRepository.findAll({
      where: { userId },
      attributes: ['taskId'],
      raw: true
    }).then(assignments => assignments.map(a => a.taskId));

    // Combiner les IDs des tâches
    const allTaskIds = [...new Set([...userTaskIds, ...assignedTaskIds])];

    // Vérifier si la tâche demandée est dans la liste des tâches accessibles
    if (!allTaskIds.includes(id)) {
      throw new NotFoundException('Tâche non trouvée');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
      include: [
        {
          model: TaskAssignment,
          required: false,
        }
      ]
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

    // Afficher les valeurs reçues dans le DTO et les valeurs existantes pour débogage
    console.log(`Valeurs reçues dans DTO:`, {
      title: dto.title,
      content: dto.content,
      priority: dto.priority,
      status: dto.status,
      color: dto.color,
      dueDate: dto.dueDate
    });

    console.log(`Valeurs existantes dans la tâche:`, {
      title: task.title,
      content: task.content,
      priority: task.priority,
      status: task.status,
      color: task.color,
      dueDate: task.dueDate
    });

    // Vérifier si des modifications doivent être apportées en comparant avec les valeurs existantes
    const updateData: any = {};
    let hasChanges = false;

    // Comparer et ajouter seulement si la valeur est différente
    if (
      dto.title !== undefined &&
      dto.title !== null &&
      dto.title.trim() !== '' &&
      dto.title !== task.title
    ) {
      console.log(
        `Changement détecté pour le titre: "${dto.title}" !== "${task.title}"`,
      );
      updateData.title = dto.title;
      hasChanges = true;
    }
    
    if (
      dto.content !== undefined &&
      dto.content !== null &&
      dto.content.trim() !== '' &&
      dto.content !== task.content
    ) {
      console.log(
        `Changement détecté pour le contenu: "${dto.content}" !== "${task.content}"`,
      );
      updateData.content = dto.content;
      hasChanges = true;
    }
    
    if (
      dto.priority !== undefined &&
      dto.priority !== null &&
      dto.priority.trim() !== '' &&
      dto.priority.toUpperCase() !== task.priority
    ) {
      console.log(
        `Changement détecté pour la priorité: "${dto.priority}" !== "${task.priority}"`,
      );
      updateData.priority = dto.priority.toUpperCase();
      hasChanges = true;
    }
    
    if (
      dto.status !== undefined &&
      dto.status !== null &&
      dto.status.trim() !== '' &&
      dto.status !== task.status
    ) {
      console.log(
        `Changement détecté pour le statut: "${dto.status}" !== "${task.status}"`,
      );
      updateData.status = dto.status;
      hasChanges = true;
    }
    
    if (
      dto.color !== undefined &&
      dto.color !== null &&
      dto.color.trim() !== '' &&
      dto.color !== task.color
    ) {
      console.log(
        `Changement détecté pour la couleur: "${dto.color}" !== "${task.color}"`,
      );
      updateData.color = dto.color;
      hasChanges = true;
    }
    
    if (dto.dueDate !== undefined && dto.dueDate !== null) {
      // Convertir les deux dates en objets Date pour comparaison équivalente
      const receivedDate = new Date(dto.dueDate);
      const existingDate = new Date(task.dueDate);
      
      // Comparer les timestamps pour ignorer les différences de format
      if (receivedDate.getTime() !== existingDate.getTime()) {
        console.log(
          `Changement détecté pour la date d'échéance: "${dto.dueDate}" !== "${task.dueDate}"`,
        );
        updateData.dueDate = dto.dueDate;
        hasChanges = true;
      }
    }

    // Si aucune modification n'a été apportée, retourner simplement la tâche sans notification
    if (!hasChanges) {
      console.log(
        `⚠️ Aucune modification détectée pour la tâche ${id}, aucune notification envoyée`,
      );
      
      // Mais si les utilisateurs assignés sont modifiés, on met à jour les assignations
      if (dto.assignedUserIds && Array.isArray(dto.assignedUserIds)) {
        await this.assignUsersToTask(id, dto.assignedUserIds);
      }
      
      return task;
    }

    console.log(`🚀 Des modifications ont été détectées, mise à jour en cours...`);

    const updatedTask = await task.update(updateData);
    
    // Gérer les assignations d'utilisateurs si elles sont fournies
    if (dto.assignedUserIds && Array.isArray(dto.assignedUserIds)) {
      await this.assignUsersToTask(id, dto.assignedUserIds);
    }
    
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

      // 2️⃣ NOTIFICATIONS POUR LES UTILISATEURS ASSIGNÉS
      console.log(` McCart Récupération des utilisateurs assignés...`);
      const assignedUsers = await this.getAssignedUsers(id);
      console.log(` McCart ${assignedUsers.length} utilisateur(s) assigné(s) trouvé(s)`);

      for (const assignedUser of assignedUsers) {
        // Ne pas notifier le propriétaire de la tâche 2 fois
        if (assignedUser.id !== userId) {
          console.log(
            ` McCart Notification mise à jour pour utilisateur assigné ${assignedUser.id}`,
          );

          // Récupérer le nom du propriétaire de la tâche
          const owner = await this.usersService.findOneById(userId);

          await this.notificationsService.create(
            assignedUser.id,
            task.id,
            NotificationType.TASK_UPDATED,
            '✏️ Tâche mise à jour',
            `${owner.username} a mis à jour la tâche "${updatedTask.title}" qui vous est assignée. Description: ${updatedTask.content}`,
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

    // Supprimer toutes les assignations liées à cette tâche
    await this.taskAssignmentRepository.destroy({
      where: { taskId: id }
    });

    // ensuite supprimer la tâche
    return task.destroy();
}

  // ✨ Obtenir les tâches en retard
  async findOverdue(userId: number) {
    console.log(`⏰ Récupération tâches en retard pour user ${userId}`);

    const now = new Date();

    // Récupérer d'abord les tâches appartenant à l'utilisateur
    const userTaskIds = await this.taskRepository.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true
    }).then(tasks => tasks.map(t => t.id));

    // Récupérer les IDs des tâches où l'utilisateur est assigné
    const assignedTaskIds = await this.taskAssignmentRepository.findAll({
      where: { userId },
      attributes: ['taskId'],
      raw: true
    }).then(assignments => assignments.map(a => a.taskId));

    // Combiner les IDs des tâches (soit propriétaires, soit assignées)
    const allTaskIds = [...new Set([...userTaskIds, ...assignedTaskIds])]; // Union avec dédoublonnage

    if (allTaskIds.length === 0) {
      // Si l'utilisateur n'a ni tâches propres ni tâches assignées, renvoyer une réponse vide
      return [];
    }

    return this.taskRepository.findAll({
      where: {
        id: { [Op.in]: allTaskIds },
        dueDate: {
          [Op.lt]: now,
        },
      },
      include: [
        {
          model: TaskAssignment,
          required: false,
        }
      ],
      order: [['dueDate', 'ASC']],
    });
  }

  // ✨ Obtenir les tâches dues bientôt
  async findDueSoon(userId: number) {
    console.log(`📅 Récupération tâches dues bientôt pour user ${userId}`);

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Récupérer d'abord les tâches appartenant à l'utilisateur
    const userTaskIds = await this.taskRepository.findAll({
      where: { userId },
      attributes: ['id'],
      raw: true
    }).then(tasks => tasks.map(t => t.id));

    // Récupérer les IDs des tâches où l'utilisateur est assigné
    const assignedTaskIds = await this.taskAssignmentRepository.findAll({
      where: { userId },
      attributes: ['taskId'],
      raw: true
    }).then(assignments => assignments.map(a => a.taskId));

    // Combiner les IDs des tâches (soit propriétaires, soit assignées)
    const allTaskIds = [...new Set([...userTaskIds, ...assignedTaskIds])]; // Union avec dédoublonnage

    if (allTaskIds.length === 0) {
      // Si l'utilisateur n'a ni tâches propres ni tâches assignées, renvoyer une réponse vide
      return [];
    }

    return this.taskRepository.findAll({
      where: {
        id: { [Op.in]: allTaskIds },
        dueDate: {
          [Op.between]: [now, tomorrow],
        },
      },
      include: [
        {
          model: TaskAssignment,
          required: false,
        }
      ],
      order: [['dueDate', 'ASC']],
    });
  }
  
  // ✨ Tâche cron pour mettre à jour les tâches expirées
  @Cron(CronExpression.EVERY_HOUR) // Exécute toutes les heures
  async updateExpiredTasks() {
    console.log('🔄 Vérification des tâches expirées...');
    
    const now = new Date();
    
    // Trouver les tâches avec statut Todo ou InProgress qui sont expirées
    const expiredTasks = await this.taskRepository.findAll({
      where: {
        dueDate: {
          [Op.lt]: now,
        },
        status: {
          [Op.or]: [TaskStatus.TODO, TaskStatus.IN_PROGRESS]
        }
      }
    });
    
    if (expiredTasks.length > 0) {
      console.log(` McCart ${expiredTasks.length} tâche(s) expirée(s) trouvée(s)`);
      
      for (const task of expiredTasks) {
        try {
          // Mettre à jour le statut de la tâche à "EXPIRED"
          await task.update({ status: TaskStatus.EXPIRED });
          
          console.log(` McCart Tâche ${task.id} mise à jour au statut EXPIRED`);
          
          // Envoyer des notifications aux utilisateurs concernés
          await this.sendExpirationNotification(task);
          
        } catch (error) {
          console.error(`❌ Erreur lors de la mise à jour de la tâche ${task.id}:`, error);
        }
      }
      
      console.log(`✅ ${expiredTasks.length} tâche(s) expirée(s) mise(s) à jour`);
    } else {
      console.log(' McCart Aucune tâche expirée trouvée');
    }
  }
  
  // ✨ Envoyer des notifications pour une tâche expirée
  private async sendExpirationNotification(task: Task) {
    console.log(` McCart Envoi de notifications pour la tâche expirée ${task.id}`);
    
    try {
      // 1️⃣ NOTIFICATION POUR LE PROPRIÉTAIRE DE LA TÂCHE
      console.log(
        ` McCart Notification expiration pour propriétaire (user ${task.userId})`,
      );
      await this.notificationsService.create(
        task.userId,
        task.id,
        NotificationType.TASK_EXPIRED,
        '⏰ Tâche expirée',
        `Votre tâche "${task.title}" a expiré sans être complétée. Statut mis à jour à "Expiré".`,
      );

      // 2️⃣ NOTIFICATIONS POUR LES UTILISATEURS ASSIGNÉS
      console.log(` McCart Récupération des utilisateurs assignés...`);
      const assignedUsers = await this.getAssignedUsers(task.id);
      console.log(` McCart ${assignedUsers.length} utilisateur(s) assigné(s) trouvé(s)`);

      for (const assignedUser of assignedUsers) {
        // Ne pas notifier le propriétaire de la tâche 2 fois
        if (assignedUser.id !== task.userId) {
          console.log(
            ` McCart Notification expiration pour utilisateur assigné ${assignedUser.id}`,
          );

          // Récupérer le nom du propriétaire de la tâche
          const owner = await this.usersService.findOneById(task.userId);

          await this.notificationsService.create(
            assignedUser.id,
            task.id,
            NotificationType.TASK_EXPIRED,
            '⏰ Tâche expirée',
            `${owner.username} n'a pas complété la tâche "${task.title}" qui vous est assignée avant la date d'échéance.`,
          );
        }
      }

      console.log(`✅ Toutes les notifications d'expiration envoyées pour la tâche ${task.id}`);
    } catch (error) {
      console.error(
        `❌ Erreur envoi notifications d'expiration pour la tâche ${task.id}:`,
        error,
      );
      // Ne pas échouer si les notifications échouent
    }
  }
}