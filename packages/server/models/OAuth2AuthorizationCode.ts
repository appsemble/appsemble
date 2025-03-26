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

import { App, AppMember } from './index.js';

@Table({ tableName: 'OAuth2AuthorizationCode', createdAt: false, updatedAt: false })
export class OAuth2AuthorizationCode extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  code!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  redirectUri!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  scope!: string;

  @AllowNull(false)
  @Column(DataType.DATE)
  expires!: Date;

  @AllowNull(false)
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId!: string;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App, { onDelete: 'CASCADE' })
  App?: Awaited<App>;
}
