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

import { App, ResourceSubscription, User } from './index.js';

@Table({ tableName: 'AppSubscription' })
export class AppSubscription extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  endpoint: string;

  @AllowNull(false)
  @Column
  p256dh: string;

  @AllowNull(false)
  @Column
  auth: string;

  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @BelongsTo(() => User)
  User: User;

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];
}
