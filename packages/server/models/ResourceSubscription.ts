import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppSubscription, Resource } from './index.js';

@Table({ tableName: 'ResourceSubscription' })
export class ResourceSubscription extends Model {
  @ForeignKey(() => Resource)
  @Column(DataType.INTEGER)
  ResourceId?: number;

  @Column(DataType.STRING)
  action?: 'create' | 'delete' | 'update';

  @Column(DataType.STRING)
  type?: string;

  @ForeignKey(() => AppSubscription)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppSubscriptionId!: number;

  @BelongsTo(() => AppSubscription)
  AppSubscription?: Awaited<AppSubscription>;

  @BelongsTo(() => Resource)
  Resource?: Awaited<Resource>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
