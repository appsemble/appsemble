import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
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

import { App } from './index.js';

@Table({ tableName: 'AppVariable' })
export class AppVariable extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Unique('UniqueNameIndex')
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  value: string;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Unique('UniqueNameIndex')
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
