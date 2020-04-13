import { DataTypes, Model, Sequelize } from 'sequelize';

import AppSubscription from './AppSubscription';
import Resource from './Resource';

export default class ResourceSubscription extends Model {
  static initialize(sequelize: Sequelize): void {
    ResourceSubscription.init(
      {
        type: {
          type: DataTypes.STRING,
        },
        action: {
          type: DataTypes.STRING,
        },
      },
      {
        sequelize,
        tableName: 'ResourceSubscription',
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    ResourceSubscription.belongsTo(AppSubscription);
    ResourceSubscription.belongsTo(Resource);
  }
}
