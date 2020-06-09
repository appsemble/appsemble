import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import BlockVersion from './BlockVersion';
import Organization from './Organization';

/**
 * Blob assets may be stored in the database before a block version itself is actually stored.
 *
 * This is all handled in a transaction, but it is the reason the primary key may not be a compound
 * primary key which includes the block version reference. For this reason, a numeric id is used as
 * the primary key..
 */
@Table({ tableName: 'BlockAsset', updatedAt: false })
export default class BlockAsset extends Model<BlockAsset> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  content: Buffer;

  @Column
  filename: string;

  @Column
  mime: string;

  @ForeignKey(() => BlockVersion)
  @Column
  name: string;

  @ForeignKey(() => BlockVersion)
  @Column
  version: string;

  @CreatedAt
  created: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Column
  OrganizationId: string;

  @BelongsTo(() => Organization)
  Organization: Organization;
}
