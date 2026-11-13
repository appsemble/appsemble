import { type OrganizationLoginMethod } from '@appsemble/types';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { User } from '../index.js';
import { OrganizationSsoSession } from './OrganizationSsoSession.js';

@Table({ tableName: 'OAuth2ClientCredentials', updatedAt: false })
export class OAuth2ClientCredentials extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare description: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare secret: string;

  @Column(DataType.DATE)
  declare expires?: Date;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare scopes: string;

  @CreatedAt
  declare created: Date;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @Column(DataType.STRING)
  declare loginMethod?: OrganizationLoginMethod;

  @ForeignKey(() => OrganizationSsoSession)
  @Column(DataType.UUID)
  declare OrganizationSsoSessionId?: string;

  @BelongsTo(() => OrganizationSsoSession, { onDelete: 'SET NULL' })
  declare OrganizationSsoSession?: Awaited<OrganizationSsoSession>;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare User?: Awaited<User>;
}
