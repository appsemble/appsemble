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

@Table({ tableName: 'AppScreenshot' })
export class AppScreenshot extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.BLOB)
  screenshot!: Buffer;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  width!: number;

  @AllowNull(false)
  @Column(DataType.INTEGER)
  height!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  mime!: string;

  @Default(0)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  index!: number;

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
