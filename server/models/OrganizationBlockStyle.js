export default (sequelize, DataTypes) =>
  sequelize.define(
    'OrganizationBlockStyle',
    {
      style: { type: DataTypes.TEXT('long') },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
