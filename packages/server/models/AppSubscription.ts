import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppMember, ResourceSubscription } from './index.js';

@Table({ tableName: 'AppSubscription' })
export class AppSubscription extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  endpoint: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  p256dh: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  auth: string;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @BelongsTo(() => AppMember, { onDelete: 'SET NULL' })
  AppMember: Awaited<AppMember>;

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];
}
