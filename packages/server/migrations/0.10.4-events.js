import { DataTypes } from 'sequelize';

export default {
  key: '0.10.4',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.addColumn('BlockVersion', 'events', {
      type: DataTypes.JSON,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('BlockVersion', 'events');
  },
};
