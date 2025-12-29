import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from '../index.js';

@Table({ tableName: 'AppReadme' })
export class AppReadme extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare file: Buffer;

  @Default('unspecified')
  @AllowNull(false)
  @Column(DataType.STRING)
  declare language: string;

  @UpdatedAt
  declare updated: Date;

  @CreatedAt
  declare created: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare AppId: number;

  @BelongsTo(() => App)
  declare App?: Awaited<App>;
}
