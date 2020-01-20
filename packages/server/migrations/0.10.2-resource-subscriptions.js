import { DataTypes } from 'sequelize';

export default {
  key: '0.10.2',

  async up(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.createTable('ResourceSubscription', {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: { type: DataTypes.STRING },
      action: { type: DataTypes.STRING },
      ResourceId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'Resource',
          key: 'id',
        },
      },
      AppSubscriptionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'AppSubscription',
          key: 'id',
        },
      },
      created: { allowNull: false, type: DataTypes.DATE },
      updated: { allowNull: false, type: DataTypes.DATE },
    });
  },

  async down(db) {
    const queryInterface = db.getQueryInterface();
    await queryInterface.dropTable('ResourceSubscription');
  },
};
