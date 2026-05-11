const { Sequelize } = require('sequelize');
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

async function ensureDatabaseStructure() {
  try {
    // Connexion à la base de données
    await sequelize.authenticate();
    console.log('Connection to database established successfully.');

    // Créer la table users si elle n'existe pas
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom VARCHAR(255) NOT NULL,
        prenom VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        password VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        photo TEXT,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL
      )
    `);

    console.log('Users table created if not exists.');

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

    console.log('Tasks table created if not exists.');

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
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (taskId) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);

    console.log('Notifications table created if not exists.');

    // S'assurer que les colonnes nécessaires existent dans la table tasks
    try {
      await sequelize.query("ALTER TABLE tasks ADD COLUMN status VARCHAR(255) DEFAULT 'todo';");
      console.log('Status column added to tasks table if not exists.');
    } catch (err) {
      // Si la colonne existe déjà, cela provoquera une erreur, ce qui est normal
      if (err.message.includes('duplicate column name') || err.message.includes('already exists')) {
        console.log('Status column already exists in tasks table.');
      } else {
        console.error('Error adding status column:', err.message);
      }
    }

    console.log('Database structure ensured successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Error ensuring database structure:', error);
    process.exit(1);
  }
}

ensureDatabaseStructure();