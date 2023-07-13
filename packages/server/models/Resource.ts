import { type Resource as ResourceType } from '@appsemble/types';
import {
  AllowNull,
  AutoIncrement,
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
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Asset, ResourceSubscription, ResourceVersion, User } from './index.js';

interface ResourceToJsonOptions {
  /**
   * Properties to exclude from the result.
   *
   * @default ['$clonable']
   */
  exclude?: string[];

  /**
   * If specified, only include these properties.
   */
  include?: string[];
}

@Table({ tableName: 'Resource' })
export class Resource extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  type: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  data: any;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  clonable: boolean;

  @Column(DataType.DATE)
  expires: Date;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  AuthorId: string;

  @BelongsTo(() => User, 'AuthorId')
  Author: Awaited<User>;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  EditorId: string;

  @BelongsTo(() => User, 'EditorId')
  Editor: Awaited<User>;

  @HasMany(() => Asset)
  Assets: Asset[];

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];

  @HasMany(() => ResourceVersion, { onDelete: 'CASCADE' })
  ResourceVersions: ResourceVersion[];

  /**
   * Represent a resource as JSON output
   *
   * @param options Serialization options.
   * @returns A JSON representation of the resource.
   */
  toJSON({ exclude = ['$clonable'], include }: ResourceToJsonOptions = {}): ResourceType {
    const result: ResourceType = {
      ...this.data,
      id: this.id,
      $created: this.created.toJSON(),
      $updated: this.updated.toJSON(),
    };

    if (this.Author) {
      result.$author = { id: this.Author.id, name: this.Author.name };
    }

    if (this.Editor) {
      result.$editor = { id: this.Editor.id, name: this.Editor.name };
    }

    if (this.clonable != null) {
      result.$clonable = this.clonable;
    }

    if (this.expires) {
      result.$expires = this.expires.toJSON();
    }

    if (include) {
      for (const name of Object.keys(result)) {
        if (!include.includes(name)) {
          delete result[name];
        }
      }
    }
    if (exclude) {
      for (const name of exclude) {
        delete result[name];
      }
    }
    return result;
  }
}
