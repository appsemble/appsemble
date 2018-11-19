export default (sequelize, DataTypes) =>
  sequelize.define(
    'ForgotPasswordToken',
    {
      token: { type: DataTypes.STRING, primaryKey: true },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
