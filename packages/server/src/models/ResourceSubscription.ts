import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import AppSubscription from './AppSubscription';
import Resource from './Resource';

@Table({ tableName: 'ResourceSubscription' })
export default class ResourceSubscription extends Model<ResourceSubscription> {
  @ForeignKey(() => Resource)
  @Column
  ResourceId: number;

  @Column
  action: 'delete' | 'update' | 'create';

  @Column
  type: string;

  @ForeignKey(() => AppSubscription)
  @Column
  AppSubscriptionId: number;

  @BelongsTo(() => AppSubscription)
  AppSubscription: AppSubscription;

  @BelongsTo(() => Resource)
  Resource: Resource;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
