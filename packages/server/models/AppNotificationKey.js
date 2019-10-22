import { DataTypes } from 'sequelize';

export default sequelize => {
  const AppNotificationKey = sequelize.define(
    'AppNotificationKey',
    {
      publicKey: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
      privateKey: { type: DataTypes.STRING, primaryKey: true, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: false,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  AppNotificationKey.associate = ({ App }) => {
    App.hasOne(AppNotificationKey);
    AppNotificationKey.belongsTo(App, { foreignKey: { allowNull: true } });
  };

  return AppNotificationKey;
};
