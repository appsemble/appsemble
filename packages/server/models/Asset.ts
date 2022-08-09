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
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Resource, User } from './index.js';

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

  @Unique('UniqueAssetNameIndex')
  @Column
  name: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Unique('UniqueAssetNameIndex')
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
