import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppMember, Resource } from './index.js';

@Table({ tableName: 'Asset' })
export class Asset extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.STRING)
  id: string;

  @Column(DataType.STRING)
  mime: string;

  @Column(DataType.STRING)
  filename: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  data: Buffer;

  @Index({ name: 'UniqueAssetNameIndex', unique: true })
  @Column(DataType.STRING)
  name: string;

  /**
   * If true, the asset will be transferred when cloning an app
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  clonable: boolean;

  /**
   * If true, the asset will be used for creating ephemeral assets in demo apps
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  seed: boolean;

  /**
   * If true, the asset is cleaned up regularly
   */
  @AllowNull(false)
  @Default(false)
  @Index({ name: 'UniqueAssetNameIndex', unique: true })
  @Column(DataType.BOOLEAN)
  ephemeral: boolean;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Index({ name: 'UniqueAssetNameIndex', unique: true })
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId: string;

  @BelongsTo(() => AppMember)
  AppMember: Awaited<AppMember>;

  @ForeignKey(() => Resource)
  @Column(DataType.INTEGER)
  ResourceId: number;

  @BelongsTo(() => Resource)
  Resource: Awaited<Resource>;
}
