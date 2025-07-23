import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type ResourceSubscription } from '../index.js';

export class AppSubscriptionGlobal extends Model {
  id!: number;

  endpoint!: string;

  p256dh!: string;

  auth!: string;

  created!: Date;

  updated!: Date;

  AppMemberId?: string;

  AppMember?: Awaited<AppMember>;

  ResourceSubscriptions!: ResourceSubscription[];
}

export function createAppSubscriptionModel(sequelize: Sequelize): typeof AppSubscriptionGlobal {
  @Table({ tableName: 'AppSubscription' })
  class AppSubscription extends AppSubscriptionGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    endpoint!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    p256dh!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    auth!: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @Column(DataType.UUID)
    AppMemberId?: string;

    static associate(models: AppModels): void {
      AppSubscription.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      });
      AppSubscription.hasMany(models.ResourceSubscription, { onDelete: 'CASCADE' });
    }
  }

  sequelize.addModels([AppSubscription]);
  return AppSubscription;
}
