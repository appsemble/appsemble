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

import { App } from '../index.js';

@Table({ tableName: 'AppMessages', paranoid: false })
export class AppMessages extends Model implements MessagesType {
  @PrimaryKey
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  @Index({ name: 'appMessagesComposite' })
  declare AppId: number;

  @BelongsTo(() => App)
  declare App?: Awaited<App>;

  @PrimaryKey
  @Column(DataType.STRING)
  @Index({ name: 'appMessagesComposite' })
  declare language: string;

  @Column(DataType.JSON)
  declare messages?: AppsembleMessages;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
