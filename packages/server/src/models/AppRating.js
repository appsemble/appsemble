import { DataTypes } from 'sequelize';

export default sequelize => {
  const AppRating = sequelize.define(
    'AppRating',
    {
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      AppId: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        unique: 'UniqueRatingIndex',
        allowNull: false,
      },
      UserId: {
        primaryKey: true,
        type: DataTypes.INTEGER,
        unique: 'UniqueRatingIndex',
        allowNull: false,
      },
    },
    {
      freezeTableName: true,
      paranoid: false,
      createdAt: 'created',
      updatedAt: 'updated',
    },
  );
  AppRating.associate = ({ App, User }) => {
    App.hasMany(AppRating);
    AppRating.belongsTo(App);
    AppRating.belongsTo(User);
  };
  return AppRating;
};
