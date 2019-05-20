export default (sequelize, DataTypes) => {
  const ResetPasswordToken = sequelize.define(
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

  ResetPasswordToken.associate = ({ EmailAuthorization }) => {
    ResetPasswordToken.belongsTo(EmailAuthorization, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
  };

  return ResetPasswordToken;
};
