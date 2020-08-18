import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppSubscription, Resource } from '.';

@Table({ tableName: 'ResourceSubscription' })
export class ResourceSubscription extends Model<ResourceSubscription> {
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
