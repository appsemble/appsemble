export default (sequelize, DataTypes) =>
  sequelize.define(
    'ResetPasswordToken',
    {
      token: { type: DataTypes.STRING, primaryKey: true },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
