import { DataTypes, Model, Sequelize } from 'sequelize';

import App from './App';
import ResourceSubscription from './ResourceSubscription';
import User from './User';

export default class AppSubscription extends Model {
  id: number;

  endpoint: string;

  p256dh: string;

  auth: string;

  App: App;

  UserId: number;

  User: User;

  ResourceSubscriptions: ResourceSubscription[];

  static initialize(sequelize: Sequelize): void {
    AppSubscription.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        endpoint: { type: DataTypes.STRING, allowNull: false },
        p256dh: { type: DataTypes.STRING, allowNull: false },
        auth: { type: DataTypes.STRING, allowNull: false },
      },
      {
        sequelize,
        tableName: 'AppSubscription',
        paranoid: false,
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    AppSubscription.belongsTo(App, { foreignKey: { allowNull: false } });
    AppSubscription.belongsTo(User, { foreignKey: { allowNull: true } });
    AppSubscription.hasMany(ResourceSubscription, { onDelete: 'CASCADE' });
  }
}
