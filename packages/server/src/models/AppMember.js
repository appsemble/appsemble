import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const AppMember = sequelize.define(
    'AppMember',
    {
      role: { type: DataTypes.STRING, allowNull: false },
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  AppMember.associate = () => {};

  return AppMember;
};
