const { Sequelize, DataTypes } = require('sequelize');
const config = require('./config/config.json');

// Charger la configuration selon l'environnement
const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

async function initializeDb() {
  try {
    // Synchroniser les modèles pour créer les tables si elles n'existent pas
    // Cela crée les tables de base sans dépendre des migrations
    
    // Créer la table users si elle n'existe pas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom VARCHAR(255) NOT NULL,
        prenom VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL,
        photo TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    // Créer la table tasks si elle n'existe pas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        priority VARCHAR(255) NOT NULL,
        color VARCHAR(255) NOT NULL,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        dueDate DATETIME,
        userId INTEGER,
        status VARCHAR(255) DEFAULT 'todo',
        FOREIGN KEY (userId) REFERENCES users (id) ON DELETE SET NULL
      )
    `);

    // Créer la table notifications si elle n'existe pas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        userId INTEGER NOT NULL,
        taskId INTEGER,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        type VARCHAR(50) NOT NULL,
        isRead BOOLEAN DEFAULT 0,
        readAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id),
        FOREIGN KEY (taskId) REFERENCES tasks(id)
      )
    `);

    console.log('Database initialized successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
}

initializeDb();