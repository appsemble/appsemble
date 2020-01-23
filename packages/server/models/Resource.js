import { DataTypes } from 'sequelize';

export default sequelize => {
  const Resource = sequelize.define(
    'Resource',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      type: DataTypes.STRING,
      data: DataTypes.JSON,
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );

  Resource.associate = ({ User, App, ResourceSubscription }) => {
    Resource.belongsTo(User);
    Resource.belongsTo(App);
    Resource.hasMany(ResourceSubscription, { onDelete: 'CASCADE' });
  };

  return Resource;
};
