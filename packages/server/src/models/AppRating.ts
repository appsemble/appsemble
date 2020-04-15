import { DataTypes, Model, Sequelize } from 'sequelize';

import App from './App';
import User from './User';

export default class AppRating extends Model {
  static initialize(sequelize: Sequelize): void {
    AppRating.init(
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
        sequelize,
        tableName: 'AppRating',
        paranoid: false,
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    App.hasMany(AppRating);
    AppRating.belongsTo(App);
    AppRating.belongsTo(User);
  }
}
