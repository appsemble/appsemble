import { ActionType, EventType } from '@appsemble/types';
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
import { Definition } from 'typescript-json-schema';

import { BlockAsset, Organization } from '.';

@Table({ tableName: 'BlockVersion', updatedAt: false })
export class BlockVersion extends Model {
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
  layout?: 'float' | 'grow' | 'hidden' | 'static' | null;

  @Column
  icon: Buffer;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.TEXT)
  longDescription: string;

  @Column(DataType.JSON)
  parameters: Definition;

  @Column(DataType.JSON)
  resources: any;

  @Column(DataType.JSON)
  actions?: Record<string, ActionType>;

  @Column(DataType.JSON)
  events: {
    listen?: Record<string, EventType>;
    emit?: Record<string, EventType>;
  };

  @BelongsTo(() => Organization)
  Organization: Organization;

  @HasMany(() => BlockAsset, { foreignKey: 'name', sourceKey: 'name' })
  BlockAssets?: BlockAsset[];

  @CreatedAt
  created: Date;
}
