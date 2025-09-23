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
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  key!: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.ENUM(...predefinedOrganizationRoles))
  role!: PredefinedOrganizationRole;

  @ForeignKey(() => User)
  @Index({ name: 'OrganizationInvite_UserId_OrganizationId_key', unique: true })
  @Column(DataType.UUID)
  UserId?: string;

  @BelongsTo(() => User)
  User?: Awaited<User>;

  @PrimaryKey
  @ForeignKey(() => Organization)
  @Index({ name: 'OrganizationInvite_UserId_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  OrganizationId!: string;

  @BelongsTo(() => Organization)
  organization?: Awaited<Organization>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
