import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { App, User } from './index.js';

@Table({ tableName: 'OAuth2AuthorizationCode', createdAt: false, updatedAt: false })
export class OAuth2AuthorizationCode extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  code: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  redirectUri: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  scope: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires: Date;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User: Awaited<User>;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App, { onDelete: 'CASCADE' })
  App: Awaited<App>;
}
