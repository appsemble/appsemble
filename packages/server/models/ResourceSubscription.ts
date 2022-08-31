import {
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppSubscription, Resource } from './index.js';

@Table({ tableName: 'ResourceSubscription' })
export class ResourceSubscription extends Model {
  @ForeignKey(() => Resource)
  @Column
  ResourceId: number;

  @Column
  action: 'create' | 'delete' | 'update';

  @Column
  type: string;

  @ForeignKey(() => AppSubscription)
  @Column
  AppSubscriptionId: number;

  @BelongsTo(() => AppSubscription)
  AppSubscription: Awaited<AppSubscription>;

  @BelongsTo(() => Resource)
  Resource: Awaited<Resource>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
