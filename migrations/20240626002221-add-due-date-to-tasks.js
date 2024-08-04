'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('tasks', 'dueDate', {
      type: Sequelize.DATE,
      allowNull: true,
      defaultValue: Sequelize.NOW,
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('tasks', 'dueDate');
  },
};
