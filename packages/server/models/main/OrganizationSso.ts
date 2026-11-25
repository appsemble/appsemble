import {
  type OrganizationLoginMethod,
  type OrganizationSsoRoleMapping,
  type OrganizationSsoSettings,
} from '@appsemble/types';
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

@Table({ tableName: 'OrganizationSso' })
export class OrganizationSso extends Model {
  @PrimaryKey
  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  declare issuer: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare clientId: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare clientSecret: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare scope: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare groupClaim: string;

  @AllowNull(false)
  @Default([])
  @Column(DataType.JSONB)
  declare roleMappings: OrganizationSsoRoleMapping[];

  @AllowNull(false)
  @Column(DataType.STRING)
  declare policy: OrganizationSsoSettings['policy'];

  @AllowNull(false)
  @Column(DataType.STRING)
  declare managedBy: OrganizationSsoSettings['managedBy'];

  @AllowNull(false)
  @Column(DataType.JSONB)
  declare allowedLoginMethods: OrganizationLoginMethod[];

  @AllowNull(false)
  @Column(DataType.DATE)
  declare configurationUpdated: Date;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @BelongsTo(() => Organization, { onDelete: 'CASCADE' })
  declare Organization?: Awaited<Organization>;
}
