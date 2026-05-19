module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier si la table existe déjà avant de la créer
    try {
      await queryInterface.describeTable('tasks');
      // Si la table existe, on ne fait rien
      console.log('La table tasks existe déjà');
    } catch (error) {
      // Si la table n'existe pas, on la crée
      await queryInterface.createTable('tasks', {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        title: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        content: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        priority: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        color: {
          type: Sequelize.STRING,
          allowNull: false,
        },
        dueDate: {
          type: Sequelize.DATE,
          allowNull: true,
        },
        userId: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: {
            model: 'users',
            key: 'id',
          },
          onUpdate: 'CASCADE',
          onDelete: 'SET NULL',
        },
        createdAt: {
          type: Sequelize.DATE,
        },
        updatedAt: {
          type: Sequelize.DATE,
        },
      });
    }
  },

  async down(queryInterface) {
    // Ne supprimer la table que si elle existe
    try {
      await queryInterface.describeTable('tasks');
      await queryInterface.dropTable('tasks');
    } catch (error) {
      // Si la table n'existe pas, on ne fait rien
      console.log("La table tasks n'existe pas, pas besoin de la supprimer");
    }
  },
};