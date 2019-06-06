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

  Resource.associate = ({ User, App }) => {
    Resource.belongsTo(User);
    Resource.belongsTo(App);
  };

  return Resource;
};
