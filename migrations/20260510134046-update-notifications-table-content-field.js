'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Vérifier si la colonne 'message' existe
    const tableDescription =
      await queryInterface.describeTable('notifications');
    
    if (tableDescription.message && !tableDescription.content) {
      // Renommer la colonne message en content
      await queryInterface.renameColumn('notifications', 'message', 'content');
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDescription =
      await queryInterface.describeTable('notifications');
    
    if (tableDescription.content && !tableDescription.message) {
      await queryInterface.renameColumn('notifications', 'content', 'message');
    }
  }
};