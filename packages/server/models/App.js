import { DataTypes } from 'sequelize';

export default sequelize => {
  const App = sequelize.define(
    'App',
    {
      id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      definition: { type: DataTypes.JSON, allowNull: false },
      description: { type: DataTypes.STRING(80), allowNull: true },
      icon: { type: DataTypes.BLOB('long') },
      path: { type: DataTypes.STRING, unique: true, allowNull: false },
      style: { type: DataTypes.TEXT('long') },
      sharedStyle: { type: DataTypes.TEXT('long') },
      yaml: { type: DataTypes.TEXT('long') },
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
