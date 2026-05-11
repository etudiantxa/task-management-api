'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add the status column as a string type since SQLite doesn't support ENUM
    await queryInterface.addColumn('tasks', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'todo',
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    // Remove the column
    await queryInterface.removeColumn('tasks', 'status');
  }
};