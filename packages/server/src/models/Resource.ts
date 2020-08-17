import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, ResourceSubscription, User } from '.';

@Table({ tableName: 'Resource', paranoid: true })
export class Resource extends Model<Resource> {
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

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

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

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];
}
