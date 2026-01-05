import { type PredefinedOrganizationRole, predefinedOrganizationRoles } from '@appsemble/types';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization, User } from '../index.js';

@Table({ tableName: 'OrganizationInvite' })
export class OrganizationInvite extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  declare email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare key: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.ENUM(...predefinedOrganizationRoles))
  declare role: PredefinedOrganizationRole;

  @ForeignKey(() => User)
  @Index({ name: 'OrganizationInvite_UserId_OrganizationId_key', unique: true })
  @Column(DataType.UUID)
  declare UserId?: string;

  @BelongsTo(() => User)
  declare User?: Awaited<User>;

  @PrimaryKey
  @ForeignKey(() => Organization)
  @Index({ name: 'OrganizationInvite_UserId_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @BelongsTo(() => Organization)
  declare organization?: Awaited<Organization>;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
