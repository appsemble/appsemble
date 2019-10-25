import { DataTypes } from 'sequelize';

export default sequelize => {
  const AppSubscription = sequelize.define(
    'AppSubscription',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      endpoint: { type: DataTypes.STRING, allowNull: false },
      p256dh: { type: DataTypes.STRING, allowNull: false },
      auth: { type: DataTypes.STRING, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: false,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  AppSubscription.associate = ({ App, User }) => {
    App.hasMany(AppSubscription);
    AppSubscription.belongsTo(App, { foreignKey: { allowNull: false } });
    AppSubscription.belongsTo(User, { foreignKey: { allowNull: true } });
  };

  return AppSubscription;
};
