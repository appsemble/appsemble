import { DataTypes } from 'sequelize';

export default sequelize => {
  const App = sequelize.define(
    'App',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      description: { type: DataTypes.STRING(80), allowNull: true },
      /**
       * The maximum length of a domain name is 255 bytes as per
       * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
       * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
       */
      domain: { type: DataTypes.STRING(253), allowNull: true },
      icon: { type: DataTypes.BLOB('long') },
      path: { type: DataTypes.STRING, unique: 'UniquePathIndex', allowNull: true },
      style: { type: DataTypes.TEXT('long') },
      sharedStyle: { type: DataTypes.TEXT('long') },
      yaml: { type: DataTypes.TEXT('long') },
      OrganizationId: {
        type: DataTypes.STRING,
        unique: 'UniquePathIndex',
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      paranoid: true,
      createdAt: 'created',
      updatedAt: 'updated',
      deletedAt: 'deleted',
    },
  );
  App.associate = ({ Resource, Organization }) => {
    App.hasMany(Resource);
    App.belongsTo(Organization, { foreignKey: { allowNull: false } });
  };
  return App;
};
