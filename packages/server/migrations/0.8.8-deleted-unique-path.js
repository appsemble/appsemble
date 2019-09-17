import { DataTypes } from 'sequelize';

export default {
  key: '0.8.8',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.changeColumn('App', 'path', {
      type: DataTypes.STRING,
      allowNull: true,
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    queryInterface.changeColumn('App', 'path', {
      type: DataTypes.STRING,
      allowNull: false,
    });
  },
};
