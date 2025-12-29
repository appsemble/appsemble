import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Model,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppModels, type AppSubscription, type Resource } from '../index.js';

@Table({ tableName: 'ResourceSubscription' })
export class ResourceSubscriptionGlobal extends Model {
  declare action?: 'create' | 'delete' | 'update';

  declare type?: string;

  declare created: Date;

  declare updated: Date;

  declare AppSubscriptionId: number;

  declare ResourceId?: number;

  declare AppSubscription?: Awaited<AppSubscription>;

  declare Resource?: Awaited<Resource>;
}

export function createResourceSubscriptionModel(
  sequelize: Sequelize,
): typeof ResourceSubscriptionGlobal {
  @Table({ tableName: 'ResourceSubscription' })
  class ResourceSubscription extends ResourceSubscriptionGlobal {
    @Column(DataType.STRING)
    declare action?: 'create' | 'delete' | 'update';

    @Column(DataType.STRING)
    declare type?: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    declare AppSubscriptionId: number;

    @Column(DataType.INTEGER)
    declare ResourceId?: number;

    static associate(models: AppModels): void {
      ResourceSubscription.belongsTo(models.AppSubscription, {
        foreignKey: 'AppSubscriptionId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      ResourceSubscription.belongsTo(models.Resource, {
        foreignKey: 'ResourceId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([ResourceSubscription]);
  return ResourceSubscription;
}
