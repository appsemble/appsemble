import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
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
  @Column
  id: number;

  @AllowNull(false)
  @Column
  screenshot: Buffer;

  @AllowNull(false)
  @Column
  width: number;

  @AllowNull(false)
  @Column
  height: number;

  @AllowNull(false)
  @Column
  mime: string;

  @UpdatedAt
  updated: Date;

  @CreatedAt
  created: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;
}
