export default sequelize => {
  const Member = sequelize.define(
    'Member',
    {},
    {
      freezeTableName: true,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );

  Member.associate = ({ User, Organization }) => {
    Member.hasOne(User);
    Member.hasOne(Organization);
  };

  return Member;
};
