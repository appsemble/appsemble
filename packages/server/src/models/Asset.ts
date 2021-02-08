import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Resource, User } from '.';

@Table({ tableName: 'Asset' })
export class Asset extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column
  id: string;

  @Column
  mime: string;

  @Column
  filename: string;

  @AllowNull(false)
  @Column
  data: Buffer;

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

  @ForeignKey(() => Resource)
  @Column
  ResourceId: number;

  @BelongsTo(() => Resource)
  Resource: Resource;
}
