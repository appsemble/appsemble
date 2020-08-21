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

import { App } from '.';

@Table({ tableName: 'AppScreenshot' })
export class AppScreenshot extends Model<AppScreenshot> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  screenshot: Buffer;

  @UpdatedAt
  updated: Date;

  @CreatedAt
  created: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;
}
