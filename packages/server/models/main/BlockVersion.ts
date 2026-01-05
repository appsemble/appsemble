import { type ActionType, type EventType } from '@appsemble/types';
import { type Schema } from 'jsonschema';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Index,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { BlockAsset, BlockMessages, Organization } from '../index.js';

@Table({ tableName: 'BlockVersion', updatedAt: false })
export class BlockVersion extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @Index({ name: 'blockVersionComposite', unique: true })
  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @AllowNull(false)
  @Index({ name: 'blockVersionComposite', unique: true })
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Index({ name: 'blockVersionComposite', unique: true })
  @Column(DataType.STRING)
  declare version: string;

  @Column(DataType.STRING)
  declare layout?: 'float' | 'grow' | 'hidden' | 'static' | null;

  @Column(DataType.BLOB)
  declare icon?: Buffer;

  @Column(DataType.TEXT)
  declare description?: string;

  @Column(DataType.TEXT)
  declare longDescription?: string;

  @Column(DataType.JSON)
  declare parameters?: Schema;

  @Column(DataType.JSON)
  declare actions?: Record<string, ActionType>;

  @Column(DataType.JSON)
  declare events?: {
    listen?: Record<string, EventType>;
    emit?: Record<string, EventType>;
  };

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare wildcardActions: boolean;

  @Default('public')
  @AllowNull(false)
  @Column(DataType.STRING)
  declare visibility: 'public' | 'unlisted';

  @AllowNull(false)
  @Default([])
  @Column(DataType.JSONB)
  declare examples: string[];

  @BelongsTo(() => Organization)
  declare Organization?: Awaited<Organization>;

  @HasMany(() => BlockAsset)
  declare BlockAssets: BlockAsset[];

  @HasMany(() => BlockMessages)
  declare BlockMessages: BlockMessages[];

  @CreatedAt
  declare created: Date;
}
