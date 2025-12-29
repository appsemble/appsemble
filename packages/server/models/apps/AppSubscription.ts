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
  declare id: number;

  declare endpoint: string;

  declare p256dh: string;

  declare auth: string;

  declare created: Date;

  declare updated: Date;

  declare AppMemberId?: string;

  declare AppMember?: Awaited<AppMember>;

  declare ResourceSubscriptions: ResourceSubscription[];
}

export function createAppSubscriptionModel(sequelize: Sequelize): typeof AppSubscriptionGlobal {
  @Table({ tableName: 'AppSubscription' })
  class AppSubscription extends AppSubscriptionGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    declare id: number;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare endpoint: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare p256dh: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare auth: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @Column(DataType.UUID)
    declare AppMemberId?: string;

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
