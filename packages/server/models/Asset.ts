import { type DestroyOptions } from 'sequelize';
import {
  AfterDestroy,
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasOne,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppMember, Group, Resource } from './index.js';

@Table({ tableName: 'Asset', paranoid: true })
export class Asset extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.STRING)
  id!: string;

  @Column(DataType.STRING)
  mime?: string;

  @Column(DataType.STRING)
  filename?: string;

  @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Index({ name: 'assetNameIndex' })
  @Index({ name: 'assetAppIdNameIndex' })
  @Column(DataType.STRING)
  name?: string;

  /**
   * If true, the asset will be transferred when cloning an app
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  clonable!: boolean;

  /**
   * If true, the asset will be used for creating ephemeral assets in demo apps
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  seed!: boolean;

  /**
   * If true, the asset is cleaned up regularly
   */
  @AllowNull(false)
  @Default(false)
  @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Column(DataType.BOOLEAN)
  ephemeral!: boolean;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  @DeletedAt
  deleted?: Date;

  // TODO remove in 0.32.1
  @Column(DataType.BLOB)
  data?: Buffer;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Index({ name: 'assetAppIdIndex' })
  @Index({ name: 'assetAppIdNameIndex' })
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @AllowNull(true)
  @ForeignKey(() => Group)
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Column(DataType.INTEGER)
  GroupId?: number;

  @BelongsTo(() => Group, { onDelete: 'CASCADE' })
  Group?: Awaited<Group>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId?: string;

  @BelongsTo(() => AppMember, { onDelete: 'CASCADE' })
  AppMember?: Awaited<AppMember>;

  @ForeignKey(() => Resource)
  @Column(DataType.INTEGER)
  ResourceId?: number;

  @BelongsTo(() => Resource, { onDelete: 'CASCADE' })
  Resource?: Awaited<Resource>;

  // TODO remove in 0.32.1
  @HasOne(() => Asset, { foreignKey: 'OriginalId', onDelete: 'CASCADE' })
  Compressed?: Awaited<Asset>;

  // TODO remove in 0.32.1
  @ForeignKey(() => Asset)
  @Column(DataType.STRING)
  OriginalId?: string;

  // TODO remove in 0.32.1
  @BelongsTo(() => Asset, { onDelete: 'SET NULL' })
  Original?: Awaited<Asset>;

  @AfterDestroy
  static async afterDestroyHook(instance: Asset, { force }: DestroyOptions): Promise<void> {
    if (force || !instance?.ephemeral) {
      return;
    }
    await instance.destroy({ force: true });
  }
}
