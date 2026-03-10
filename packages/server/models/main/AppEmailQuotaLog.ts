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
  declare id: number;

  // TODO: make this non-nullable
  @Column(DataType.INTEGER)
  @ForeignKey(() => App)
  declare AppId?: number;

  @BelongsTo(() => App)
  declare App?: Awaited<App>;

  @CreatedAt
  declare created: Date;
}
