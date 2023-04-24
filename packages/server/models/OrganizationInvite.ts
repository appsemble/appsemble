import { type Role, roles } from '@appsemble/utils';
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
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization, User } from './index.js';

@Table({ tableName: 'OrganizationInvite' })
export class OrganizationInvite extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column
  email: string;

  @AllowNull(false)
  @Column
  key: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.keys(roles)))
  role: Role;

  @ForeignKey(() => User)
  @Unique('EmailOrganizationIndex')
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: Awaited<User>;

  @PrimaryKey
  @ForeignKey(() => Organization)
  @Unique('EmailOrganizationIndex')
  @Column
  OrganizationId: string;

  @BelongsTo(() => Organization)
  organization: Awaited<Organization>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
