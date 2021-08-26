import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, User } from '.';

@Table({ tableName: 'AppMember' })
export class AppMember extends Model {
  @AllowNull(false)
  @Column
  role: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @PrimaryKey
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @ForeignKey(() => User)
  @PrimaryKey
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;
}
