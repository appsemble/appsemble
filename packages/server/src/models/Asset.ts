import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Resource, User } from '.';

@Table({ tableName: 'Asset', paranoid: true })
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

  @ForeignKey(() => Resource)
  @Column
  ResourceId: number;

  @BelongsTo(() => Resource)
  Resource: Resource;
}
