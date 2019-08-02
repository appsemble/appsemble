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

  Member.associate = () => {};

  return Member;
};
