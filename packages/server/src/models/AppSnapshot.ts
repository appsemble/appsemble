import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { App, User } from '.';

@Table({ tableName: 'AppSnapshot' })
export class AppSnapshot extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  yaml: string;

  @CreatedAt
  created: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;
}
