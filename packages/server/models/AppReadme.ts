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

import { App } from './index.js';

@Table({ tableName: 'AppReadme' })
export class AppReadme extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.BLOB)
  file!: Buffer;

  @Default('unspecified')
  @AllowNull(false)
  @Column(DataType.STRING)
  language!: string;

  @UpdatedAt
  updated!: Date;

  @CreatedAt
  created!: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;
}
