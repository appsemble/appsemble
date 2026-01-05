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
  declare id: number;

  declare idpCertificate: string;

  declare entityId: string;

  declare ssoUrl: string;

  declare name: string;

  declare icon: IconName;

  declare spPrivateKey: string;

  declare spPublicKey: string;

  declare spCertificate: string;

  declare emailAttribute: string;

  declare emailVerifiedAttribute?: string;

  declare nameAttribute?: string;

  declare objectIdAttribute?: string;

  declare created: Date;

  declare updated: Date;

  declare AppSamlAuthorizations: AppSamlAuthorization[];

  declare SamlLoginRequests: SamlLoginRequest[];
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
    declare id: number;

    @AllowNull(false)
    @Column(DataType.TEXT)
    declare idpCertificate: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare entityId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare ssoUrl: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare name: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare icon: IconName;

    @AllowNull(false)
    @Column(DataType.TEXT)
    declare spPrivateKey: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    declare spPublicKey: string;

    @AllowNull(false)
    @Column(DataType.TEXT)
    declare spCertificate: string;

    @AllowNull(false)
    @Default(DEFAULT_SAML_EMAIL_ATTRIBUTE)
    @Column(DataType.STRING)
    declare emailAttribute: string;

    @Column(DataType.STRING)
    declare emailVerifiedAttribute?: string;

    @Column(DataType.STRING)
    declare nameAttribute?: string;

    // Unique identifier of the external user
    @Column(DataType.STRING)
    declare objectIdAttribute?: string;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    static associate(models: AppModels): void {
      AppSamlSecret.hasMany(models.AppSamlAuthorization, { onDelete: 'CASCADE' });
      AppSamlSecret.hasMany(models.SamlLoginRequest, { onDelete: 'CASCADE' });
    }
  }

  sequelize.addModels([AppSamlSecret]);
  return AppSamlSecret;
}
