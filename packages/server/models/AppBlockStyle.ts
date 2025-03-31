import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from './index.js';

@Table({ tableName: 'AppBlockStyle' })
export class AppBlockStyle extends Model {
  @PrimaryKey
  @AllowNull(false)
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId!: number;

  /**
   * This refers to the organization and name of a block
   * it is agnostic of the version of the block.
   *
   * Format: @organizationName/blockName
   */
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  block!: string;

  @Column({ type: DataType.TEXT })
  style?: string;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
