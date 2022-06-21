import { AppsembleMessages, Messages as MessagesType } from '@appsemble/types';
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
export class AppMessages extends Model implements MessagesType {
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
  messages: AppsembleMessages;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
