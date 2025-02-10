import { logger } from '@appsemble/node-utils';
import { type Transaction } from 'sequelize';
import {
  AfterBulkCreate,
  AfterCreate,
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
import sharp from 'sharp';

import { App, AppMember, Group, Resource } from './index.js';

@Table({ tableName: 'Asset', paranoid: true })
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

  @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Index({ name: 'assetNameIndex' })
  @Index({ name: 'assetAppIdNameIndex' })
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
  @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Column(DataType.BOOLEAN)
  ephemeral: boolean;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Index({ name: 'UniqueAssetWithNullGroupId', unique: true })
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Index({ name: 'assetAppIdIndex' })
  @Index({ name: 'assetAppIdNameIndex' })
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @AllowNull(true)
  @ForeignKey(() => Group)
  @Index({ name: 'UniqueAssetWithGroupId', unique: true })
  @Column(DataType.INTEGER)
  GroupId: number;

  @BelongsTo(() => Group, { onDelete: 'CASCADE' })
  Group: Awaited<Group>;

  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId: string;

  @BelongsTo(() => AppMember, { onDelete: 'CASCADE' })
  AppMember: Awaited<AppMember>;

  @ForeignKey(() => Resource)
  @Column(DataType.INTEGER)
  ResourceId: number;

  @BelongsTo(() => Resource, { onDelete: 'CASCADE' })
  Resource: Awaited<Resource>;

  @HasOne(() => Asset, { foreignKey: 'OriginalId', onDelete: 'CASCADE' })
  Compressed: Awaited<Asset>;

  @ForeignKey(() => Asset)
  @Column(DataType.STRING)
  OriginalId: string;

  @BelongsTo(() => Asset, { onDelete: 'SET NULL' })
  Original: Awaited<Asset>;

  private static async createCompressedAsset(
    instance: Asset,
    transaction?: Transaction,
  ): Promise<void> {
    if (
      instance.mime?.startsWith('image') &&
      instance.mime !== 'image/avif' &&
      instance.OriginalId == null
    ) {
      try {
        const compressed = await sharp(instance.data).rotate().toFormat('avif').toBuffer();

        await Asset.create(
          {
            name: instance.name ? `${instance.name}_compressed` : null,
            filename: `${instance.filename.slice(0, instance.filename.lastIndexOf('.'))}.avif`,
            mime: 'image/avif',
            data: compressed,
            seed: instance.seed,
            ephemeral: instance.ephemeral,
            OriginalId: instance.id,
            AppId: instance.AppId,
          },
          { transaction },
        );
      } catch (error) {
        logger.error(`Failed to compress image ${instance.filename}`);
        logger.error(error);
      }
    }
  }

  @AfterCreate
  static async afterCreateHook(
    instance: Asset,
    options: { transaction?: Transaction },
  ): Promise<void> {
    await Asset.createCompressedAsset(instance, options.transaction);
  }

  @AfterBulkCreate
  static async afterBulkCreateHook(
    instances: Asset[],
    options: { transaction?: Transaction },
  ): Promise<void> {
    await Promise.all(
      instances.map((instance) => Asset.createCompressedAsset(instance, options.transaction)),
    );
  }
}
