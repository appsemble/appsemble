const User = (sequelize, DataTypes) => sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
}, {
  freezeTableName: true,
  paranoid: true,
});

export default User;
