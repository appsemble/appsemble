import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { BlockVersion } from '../index.js';

@Table({ tableName: 'BlockMessages' })
export class BlockMessages extends Model {
  @PrimaryKey
  @AllowNull(false)
  @ForeignKey(() => BlockVersion)
  @Column(DataType.UUID)
  declare BlockVersionId: string;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare language: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  declare messages: Record<string, string>;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
