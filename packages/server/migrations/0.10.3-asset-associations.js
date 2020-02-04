import { DataTypes } from 'sequelize';

export default {
  key: '0.10.3',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.addColumn('Asset', 'AppId', {
      type: DataTypes.INTEGER,
      // null is allowed to allow for smoother manual associations
      allowNull: true,
      references: {
        model: 'App',
        key: 'id',
      },
    });

    await queryInterface.addColumn('Asset', 'UserId', {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'User',
        key: 'id',
      },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.removeColumn('Asset', 'AppId');
    await queryInterface.removeColumn('Asset', 'UserId');
  },
};
