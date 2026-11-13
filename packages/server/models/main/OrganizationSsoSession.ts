import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization } from './Organization.js';
import { OrganizationSsoIdentity } from './OrganizationSsoIdentity.js';

@Table({ tableName: 'OrganizationSsoSession' })
export class OrganizationSsoSession extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @AllowNull(false)
  @ForeignKey(() => OrganizationSsoIdentity)
  @Column(DataType.UUID)
  declare OrganizationSsoIdentityId: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare accessToken: Buffer;

  @Column(DataType.BLOB)
  declare refreshToken?: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING(64))
  declare refreshTokenHash: string;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare interactiveRevoked: boolean;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare accessTokenExpires: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare expires: Date;

  @AllowNull(false)
  @Column(DataType.DATE)
  declare configurationUpdated: Date;

  @AllowNull(false)
  @Default([])
  @Column(DataType.JSONB)
  declare groups: string[];

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @BelongsTo(() => Organization, { onDelete: 'CASCADE' })
  declare Organization?: Awaited<Organization>;

  @BelongsTo(() => OrganizationSsoIdentity, { onDelete: 'CASCADE' })
  declare OrganizationSsoIdentity?: Awaited<OrganizationSsoIdentity>;
}
