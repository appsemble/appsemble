import { DataTypes } from 'sequelize';

export default {
  key: '0.10.5',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.createTable('OAuth2AuthorizationCode', {
      code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
      redirectUri: { type: DataTypes.STRING, allowNull: false },
      expires: { type: DataTypes.DATE, allowNull: false },
      UserId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'User',
          key: 'id',
        },
      },
      AppId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'App',
          key: 'id',
        },
      },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.dropTable('OAuth2AuthorizationCode');
  },
};
