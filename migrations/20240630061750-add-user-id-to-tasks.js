'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('tasks', 'userId', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('tasks', 'userId');
  },
};
