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
  BlockVersionId!: string;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  language!: string;

  @AllowNull(false)
  @Column(DataType.JSON)
  messages!: Record<string, string>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
