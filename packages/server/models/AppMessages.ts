// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import { type AppsembleMessages, Messages as MessagesType } from '@appsemble/types';
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from './index.js';

@Table({ tableName: 'AppMessages', paranoid: false })
export class AppMessages extends Model implements MessagesType {
  @PrimaryKey
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  @Index({ name: 'appMessagesComposite' })
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @PrimaryKey
  @Column(DataType.STRING)
  @Index({ name: 'appMessagesComposite' })
  language!: string;

  @Column(DataType.JSON)
  messages?: AppsembleMessages;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
