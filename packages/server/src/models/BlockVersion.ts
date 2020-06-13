import type { ActionType, EventType } from '@appsemble/types';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';

import BlockAsset from './BlockAsset';
import Organization from './Organization';

@Table({ tableName: 'BlockVersion', updatedAt: false })
export default class BlockVersion extends Model<BlockVersion> {
  @PrimaryKey
  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column
  OrganizationId: string;

  @PrimaryKey
  @ForeignKey(() => BlockAsset)
  @Unique('blockVersionComposite')
  @Column
  name: string;

  @PrimaryKey
  @ForeignKey(() => BlockAsset)
  @Unique('blockVersionComposite')
  @Column
  version: string;

  @Column(DataType.STRING)
  layout?: 'float' | 'static' | 'grow' | 'hidden' | null;

  @Column
  icon: Buffer;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  longDescription: string;

  @Column(DataType.JSON)
  parameters: object;

  @Column(DataType.JSON)
  resources: any;

  @Column(DataType.JSON)
  actions?: { [key: string]: ActionType };

  @Column(DataType.JSON)
  events: {
    listen?: { [key: string]: EventType };
    emit?: { [key: string]: EventType };
  };

  @BelongsTo(() => Organization)
  Organization: Organization;

  @HasMany(() => BlockAsset, { foreignKey: 'name', sourceKey: 'name' })
  BlockAssets?: BlockAsset[];

  @CreatedAt
  created: Date;
}
