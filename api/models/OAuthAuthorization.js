const OAuthAuthorization = (sequelize, DataTypes) => sequelize.define('OAuthAuthorization', {
  id: { type: DataTypes.STRING, primaryKey: true },
  provider: { type: DataTypes.STRING, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

export default OAuthAuthorization;
