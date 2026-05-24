'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    try {
      await queryInterface.renameTable('Notificatios', 'Notifications');
    } catch (error) {
      console.log('Table déjà renommée ou inexistante, on continue...');
    }
  },

  async down(queryInterface, Sequelize) {
    try {
      await queryInterface.renameTable('Notifications', 'Notificatios');
    } catch (error) {
      console.log('Rollback ignoré');
    }
  }
};