import {
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

import { App } from '.';

@Table({ tableName: 'AppTranslation', paranoid: false })
export default class AppTranslation extends Model<AppTranslation> {
  @PrimaryKey
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @PrimaryKey
  @Column
  language: string;

  @Column(DataType.TEXT)
  content: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
