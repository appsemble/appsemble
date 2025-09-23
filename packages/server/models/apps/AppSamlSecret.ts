import { type IconName } from '@fortawesome/fontawesome-common-types';
import {
  AllowNull,
  AutoIncrement,
  Column,
  CreatedAt,
  DataType,
  Default,
  DefaultScope,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppModels, type AppSamlAuthorization, type SamlLoginRequest } from '../index.js';

export const DEFAULT_SAML_EMAIL_ATTRIBUTE =
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress';

export class AppSamlSecretGlobal extends Model {
  id!: number;

  idpCertificate!: string;

  entityId!: string;

  ssoUrl!: string;

  name!: string;

  icon!: IconName;

  spPrivateKey!: string;

  spPublicKey!: string;

  spCertificate!: string;

  emailAttribute!: string;

  emailVerifiedAttribute?: string;

  nameAttribute?: string;

  objectIdAttribute?: string;

  created!: Date;

  updated!: Date;

  AppSamlAuthorizations!: AppSamlAuthorization[];

  SamlLoginRequests!: SamlLoginRequest[];
}

export function createAppSamlSecretModel(sequelize: Sequelize): typeof AppSamlSecretGlobal {
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
      'emailVerifiedAttribute',
      'nameAttribute',
    ],
  }))
  @Table({ tableName: 'AppSamlSecret' })
  class AppSamlSecret extends AppSamlSecretGlobal {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
    id!: number;

    @AllowNull(false)
    @Column(DataType.TEXT)
    idpCertificate!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    entityId!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    ssoUrl!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    name!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    icon!: IconName;

    @AllowNull(false)
    @Column(DataType.TEXT)
    spPrivateKey!: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    spPublicKey!: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    spCertificate!: string;

    @AllowNull(false)
    @Default(DEFAULT_SAML_EMAIL_ATTRIBUTE)
    @Column(DataType.STRING)
    emailAttribute!: string;

    @Column(DataType.STRING)
    emailVerifiedAttribute?: string;

    @Column(DataType.STRING)
    nameAttribute?: string;

    // Unique identifier of the external user
    @Column(DataType.STRING)
    objectIdAttribute?: string;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    static associate(models: AppModels): void {
      AppSamlSecret.hasMany(models.AppSamlAuthorization, { onDelete: 'CASCADE' });
      AppSamlSecret.hasMany(models.SamlLoginRequest, { onDelete: 'CASCADE' });
    }
  }

  sequelize.addModels([AppSamlSecret]);
  return AppSamlSecret;
}
