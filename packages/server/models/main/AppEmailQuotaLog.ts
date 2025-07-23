import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { App } from './App.js';

@Table({ tableName: 'AppEmailQuotaLog', updatedAt: false })
export class AppEmailQuotaLog extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  // TODO: make this non-nullable
  @Column(DataType.INTEGER)
  @ForeignKey(() => App)
  AppId?: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @CreatedAt
  created!: Date;
}
