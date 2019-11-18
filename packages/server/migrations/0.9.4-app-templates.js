import { DataTypes } from 'sequelize';

export default {
  key: '0.9.1',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.addColumn('App', 'template', {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('App', 'template');
  },
};
