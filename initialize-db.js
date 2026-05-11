const { Sequelize } = require('sequelize');
const config = require('./config/config.json');

// Charger la configuration selon l'environnement
const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

async function initializeDatabase() {
  try {
    // S'assurer que la base de données est prête
    await sequelize.authenticate();
    console.log('Connexion à la base de données réussie.');

    // Créer les tables si elles n'existent pas
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

    console.log('Tables créées si elles n\'existaient pas.');
    
    // Fermer la connexion
    await sequelize.close();
    
    console.log('Initialisation de la base de données terminée.');
    process.exit(0);
  } catch (error) {
    console.error('Erreur lors de l\'initialisation de la base de données:', error);
    process.exit(1);
  }
}

initializeDatabase();