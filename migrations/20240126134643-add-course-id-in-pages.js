'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Pages', 'courseId', {
      type: Sequelize.DataTypes.INTEGER
    })

    await queryInterface.addConstraint('Pages', {
      fields: ['courseId'],
      type: 'foreign key',
      references: {
        table: 'courses',
        field: 'id'
      }
    })
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Pages', 'courseId')
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
  }
};
