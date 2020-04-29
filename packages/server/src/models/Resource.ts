import { DataTypes, Model, Sequelize } from 'sequelize';

import App from './App';
import ResourceSubscription from './ResourceSubscription';
import User from './User';

export default class Resource extends Model {
  static initialize(sequelize: Sequelize): void {
    Resource.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        type: DataTypes.STRING,
        data: DataTypes.JSON,
      },
      {
        sequelize,
        tableName: 'Resource',
        paranoid: true,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    Resource.belongsTo(User);
    Resource.belongsTo(App);
    Resource.hasMany(ResourceSubscription, { onDelete: 'CASCADE' });
  }
}
