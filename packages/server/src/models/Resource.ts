import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Asset, ResourceSubscription, User } from '.';

@Table({ tableName: 'Resource' })
export class Resource extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  type: string;

  @Column(DataType.JSON)
  data: any;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  clonable: boolean;

  @Column
  expires: Date;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;

  @HasMany(() => Asset)
  Assets: Asset[];

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];
}
