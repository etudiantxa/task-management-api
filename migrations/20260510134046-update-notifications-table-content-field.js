'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Désactiver les contrôles de clé étrangère pendant la migration
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');

    // Sauvegarder les données existantes
    const notifications = await queryInterface.sequelize.query(
      'SELECT id, userId, taskId, title, message as content, type, isRead, readAt, createdAt, updatedAt FROM notifications',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Supprimer l'ancienne table
    await queryInterface.dropTable('notifications');

    // Créer la nouvelle table avec le bon nom de colonne
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Restaurer les données sauvegardées
    if (notifications.length > 0) {
      await queryInterface.bulkInsert('notifications', notifications.map(n => ({
        ...n,
        content: n.content // Utiliser le champ content au lieu de message
      })));
    }

    // Réactiver les contrôles de clé étrangère
    await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
  },

  async down(queryInterface, Sequelize) {
    // Désactiver les contrôles de clé étrangère pendant la migration
    await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');

    // Sauvegarder les données existantes
    const notifications = await queryInterface.sequelize.query(
      'SELECT id, userId, taskId, title, content as message, type, isRead, readAt, createdAt, updatedAt FROM notifications',
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Supprimer la table actuelle
    await queryInterface.dropTable('notifications');

    // Recréer la table avec l'ancien nom de colonne
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      taskId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'tasks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      type: {
        type: Sequelize.STRING,
        allowNull: false
      },
      isRead: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      readAt: {
        type: Sequelize.DATE
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });

    // Restaurer les données sauvegardées
    if (notifications.length > 0) {
      await queryInterface.bulkInsert('notifications', notifications.map(n => ({
        ...n,
        message: n.content // Utiliser le champ message au lieu de content
      })));
    }

    // Réactiver les contrôles de clé étrangère
    await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
  }
};