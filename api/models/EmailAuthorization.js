const EmailAuthorization = (sequelize, DataTypes) => sequelize.define('EmailAuthorization', {
  email: { type: DataTypes.STRING, primaryKey: true },
  name: DataTypes.STRING,
  password: { type: DataTypes.STRING, allowNull: false },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
}, {
  freezeTableName: true,
  paranoid: true,
});

export default EmailAuthorization;
