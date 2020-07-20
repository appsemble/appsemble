import type { AppMessages as AppMessagesType } from '@appsemble/types';
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

@Table({ tableName: 'AppMessages', paranoid: false })
export default class AppMessages extends Model<AppMessages> implements AppMessagesType {
  @PrimaryKey
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @PrimaryKey
  @Column
  language: string;

  @Column(DataType.JSON)
  messages: { [messageId: string]: string };

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
