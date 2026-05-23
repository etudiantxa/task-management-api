'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier le type de dialecte pour appliquer les commandes appropriées
    const dialect = queryInterface.sequelize.getDialect();
    
    let notifications = [];
    
    try {
      // Sauvegarder les données existantes - en essayant plusieurs variations de noms de colonnes
      notifications = await queryInterface.sequelize.query(
        'SELECT id, "userId", "taskId", title, message as content, type, "isRead", "readAt", "createdAt", "updatedAt" FROM notifications',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      // Si la requête échoue, essayer avec d'autres variantes de noms de colonnes
      try {
        notifications = await queryInterface.sequelize.query(
          'SELECT id, "userId", "taskId", title, message as content, type, "isRead", "readAt", createdat, updatedat FROM notifications',
          { type: queryInterface.sequelize.QueryTypes.SELECT }
        );
      } catch (error2) {
        // Si aucune variante ne fonctionne, continuer sans données sauvegardées
        console.log("Aucune donnée existante trouvée dans la table notifications, ou erreur de lecture:", error.message);
      }
    }
    
    if (dialect === 'sqlite') {
      // Commandes spécifiques à SQLite
      await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    } else if (dialect === 'postgres') {
      // Désactiver les contraintes de clé étrangère pour PostgreSQL
      await queryInterface.sequelize.query('SET session_replication_role = replica;');
    }
    
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
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // Restaurer les données sauvegardées
    if (notifications && notifications.length > 0) {
      await queryInterface.bulkInsert('notifications', notifications.map(n => ({
        ...n,
        content: n.content || n.message // Utiliser le contenu renommé
      })));
    }

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
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    // Restaurer les données sauvegardées
    if (notifications.length > 0) {
      await queryInterface.bulkInsert('notifications', notifications.map(n => ({
        ...n,
        content: n.content // Utiliser le contenu renommé
      })));
    }

    if (dialect === 'sqlite') {
      // Réactiver les contrôles de clé étrangère pour SQLite
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    } else if (dialect === 'postgres') {
      // Réactiver les contraintes de clé étrangère pour PostgreSQL
      await queryInterface.sequelize.query('SET session_replication_role = DEFAULT;');
    }
  },

  async down(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();
    
    let notifications = [];
    
    try {
      // Sauvegarder les données existantes
      notifications = await queryInterface.sequelize.query(
        'SELECT id, "userId", "taskId", title, content as message, type, "isRead", "readAt", "createdAt", "updatedAt" FROM notifications',
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
    } catch (error) {
      console.log("Aucune donnée existante trouvée dans la table notifications, ou erreur de lecture:", error.message);
    }
    
    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query('PRAGMA foreign_keys = OFF');
    } else if (dialect === 'postgres') {
      await queryInterface.sequelize.query('SET session_replication_role = replica;');
    }
    
    // Supprimer la table actuelle
    await queryInterface.dropTable('notifications');
    
    // Recréer l'ancienne table avec message au lieu de content
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
        type: Sequelize.STRING,
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
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
    
    // Restaurer les données sauvegardées
    if (notifications && notifications.length > 0) {
      await queryInterface.bulkInsert('notifications', notifications.map(n => ({
        ...n,
        message: n.content || n.message // Remap content to message
      })));
    }
    
    if (dialect === 'sqlite') {
      await queryInterface.sequelize.query('PRAGMA foreign_keys = ON');
    } else if (dialect === 'postgres') {
      await queryInterface.sequelize.query('SET session_replication_role = DEFAULT;');
    }
  }
};