import { DataTypes } from 'sequelize';

export default sequelize => {
  const App = sequelize.define(
    'App',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      /**
       * The maximum length of a domain name is 255 bytes as per
       * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
       * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
       */
      domain: { type: DataTypes.STRING(253), allowNull: true },
      icon: { type: DataTypes.BLOB },
      path: { type: DataTypes.STRING, unique: 'UniquePathIndex', allowNull: true },
      private: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      template: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
      style: { type: DataTypes.TEXT },
      sharedStyle: { type: DataTypes.TEXT },
      yaml: { type: DataTypes.TEXT },
      vapidPublicKey: { type: DataTypes.STRING, allowNull: false },
      vapidPrivateKey: { type: DataTypes.STRING, allowNull: false },
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
