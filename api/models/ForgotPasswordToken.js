export default (sequelize, DataTypes) =>
  sequelize.define(
    'ForgotPasswordToken',
    {
      token: { type: DataTypes.STRING, primaryKey: true },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
