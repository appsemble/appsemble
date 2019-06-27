import { DataTypes } from 'sequelize';

export default sequelize => {
  const Member = sequelize.define(
    'Member',
    {
      verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      key: DataTypes.STRING,
      email: DataTypes.STRING,
    },
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  Member.associate = () => {};

  return Member;
};
