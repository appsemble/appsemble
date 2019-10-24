import { DataTypes } from 'sequelize';

export default sequelize => {
  const App = sequelize.define(
    'App',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      icon: { type: DataTypes.BLOB('long') },
      path: { type: DataTypes.STRING, unique: 'UniquePathIndex', allowNull: true },
      private: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
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
