export default (sequelize, DataTypes) =>
  sequelize.define(
    'ForgotPasswordToken',
    {
      id: { type: DataTypes.STRING, primaryKey: true },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
