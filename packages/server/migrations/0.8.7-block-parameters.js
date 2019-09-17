import { DataTypes } from 'sequelize';

export default {
  key: '0.8.7',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.addColumn('BlockVersion', 'parameters', {
      type: DataTypes.JSON,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.removeColumn('BlockVersion', 'parameters');
  },
};
