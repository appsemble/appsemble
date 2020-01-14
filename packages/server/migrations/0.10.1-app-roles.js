import { DataTypes } from 'sequelize';

export default {
  key: '0.10.1',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.createTable('AppMember', {
      role: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'App',
          key: 'id',
        },
      },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.dropTable('AppMember');
  },
};
