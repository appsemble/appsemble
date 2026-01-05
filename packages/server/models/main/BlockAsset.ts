import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { BlockVersion } from '../index.js';

/**
 * Blob assets may be stored in the database before a block version itself is actually stored.
 *
 * This is all handled in a transaction, but it is the reason the primary key may not be a compound
 * primary key which includes the block version reference. For this reason, a numeric id is used as
 * the primary key..
 */
@Table({ tableName: 'BlockAsset', updatedAt: false })
export class BlockAsset extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare content: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  @Index({ name: 'blockAssetFilenameIndex' })
  declare filename: string;

  @Column(DataType.STRING)
  declare mime?: string;

  @Index('BlockAssetBlockVersionId')
  @ForeignKey(() => BlockVersion)
  @AllowNull(false)
  @Column(DataType.UUID)
  declare BlockVersionId: string;

  @CreatedAt
  declare created: Date;

  @BelongsTo(() => BlockVersion, { onDelete: 'CASCADE' })
  declare BlockVersion?: Awaited<BlockVersion>;
}
