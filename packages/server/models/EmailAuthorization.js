import { DataTypes } from 'sequelize';

export default sequelize => {
  const EmailAuthorization = sequelize.define(
    'EmailAuthorization',
    {
      email: { type: DataTypes.STRING, primaryKey: true },
      verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      key: DataTypes.STRING,
    },
    {
      freezeTableName: true,
      paranoid: false,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  EmailAuthorization.associate = ({ User }) => {
    EmailAuthorization.belongsTo(User);
  };

  return EmailAuthorization;
};
