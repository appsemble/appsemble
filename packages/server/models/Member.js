import { roles } from '@appsemble/utils/constants/roles';
import { DataTypes } from 'sequelize';

export default sequelize => {
  const Member = sequelize.define(
    'Member',
    {
      role: { type: DataTypes.ENUM(Object.keys(roles)), defaultValue: 'Member', required: true },
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
