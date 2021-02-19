import { Messages as MessagesType } from '@appsemble/types';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import { BlockVersion } from '.';

@Table({ tableName: 'BlockMessages', paranoid: false })
export class BlockMessages extends Model implements MessagesType {
  @PrimaryKey
  @AllowNull(false)
  @Unique('blockVersionComposite')
  @ForeignKey(() => BlockVersion)
  @Column
  OrganizationId: string;

  @PrimaryKey
  @AllowNull(false)
  @ForeignKey(() => BlockVersion)
  @Unique('blockVersionComposite')
  @Column
  name: string;

  @PrimaryKey
  @AllowNull(false)
  @Unique('blockVersionComposite')
  @ForeignKey(() => BlockVersion)
  @Column
  version: string;

  @PrimaryKey
  @AllowNull(false)
  @Unique('blockVersionComposite')
  @Column
  language: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  messages: Record<string, string>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
