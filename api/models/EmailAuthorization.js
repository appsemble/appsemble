export default (sequelize, DataTypes) =>
  sequelize.define(
    'EmailAuthorization',
    {
      email: { type: DataTypes.STRING, primaryKey: true },
      name: DataTypes.STRING,
      password: { type: DataTypes.STRING, allowNull: false },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
