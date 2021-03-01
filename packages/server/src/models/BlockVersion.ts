import { ActionType, EventType } from '@appsemble/types';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  Unique,
} from 'sequelize-typescript';
import { Definition } from 'typescript-json-schema';

import { BlockAsset, BlockMessages, Organization } from '.';

@Table({ tableName: 'BlockVersion', updatedAt: false })
export class BlockVersion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Unique('blockVersionComposite')
  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column
  OrganizationId: string;

  @Unique('blockVersionComposite')
  @Column
  name: string;

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

  @HasMany(() => BlockAsset)
  BlockAssets?: BlockAsset[];

  @HasMany(() => BlockMessages)
  BlockMessages: BlockMessages[];

  @CreatedAt
  created: Date;
}
