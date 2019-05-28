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

  ResetPasswordToken.associate = ({ User }) => {
    ResetPasswordToken.belongsTo(User, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
  };

  return ResetPasswordToken;
};
