import { type IconName } from '@fortawesome/fontawesome-common-types';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppSamlAuthorization, SamlLoginRequest } from './index.js';

@DefaultScope(() => ({
  attributes: [
    'id',
    'idpCertificate',
    'entityId',
    'ssoUrl',
    'name',
    'icon',
    'spCertificate',
    'emailAttribute',
    'nameAttribute',
  ],
}))
@Table({ tableName: 'AppSamlSecret' })
export class AppSamlSecret extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  idpCertificate: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  entityId: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  ssoUrl: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  icon: IconName;

  @AllowNull(false)
  @Column(DataType.TEXT)
  spPrivateKey: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  spPublicKey: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  spCertificate: string;

  @Column(DataType.STRING)
  emailAttribute: string;

  @Column(DataType.STRING)
  nameAttribute: string;

  // Unique identifier of the external user
  @Column(DataType.STRING)
  objectIdAttribute: string;

  /**
   * The id of the app this secret is linked to.
   */
  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @HasMany(() => AppSamlAuthorization, { onDelete: 'CASCADE' })
  AppSamlAuthorizations: AppSamlAuthorization[];

  @HasMany(() => SamlLoginRequest, { onDelete: 'CASCADE' })
  SamlLoginRequests: SamlLoginRequest[];
}
