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
  action?: 'create' | 'delete' | 'update';

  type?: string;

  created!: Date;

  updated!: Date;

  AppSubscriptionId!: number;

  ResourceId?: number;

  AppSubscription?: Awaited<AppSubscription>;

  Resource?: Awaited<Resource>;
}

export function createResourceSubscriptionModel(
  sequelize: Sequelize,
): typeof ResourceSubscriptionGlobal {
  @Table({ tableName: 'ResourceSubscription' })
  class ResourceSubscription extends ResourceSubscriptionGlobal {
    @Column(DataType.STRING)
    action?: 'create' | 'delete' | 'update';

    @Column(DataType.STRING)
    type?: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @AllowNull(false)
    @Column(DataType.INTEGER)
    AppSubscriptionId!: number;

    @Column(DataType.INTEGER)
    ResourceId?: number;

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
