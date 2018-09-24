export default (sequelize, DataTypes) => sequelize.define('OAuthAuthorization', {
  id: { type: DataTypes.STRING, primaryKey: true },
  provider: { type: DataTypes.STRING, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
  createdAt: 'created',
  updatedAt: 'updated',
  deletedAt: 'deleted',
});
