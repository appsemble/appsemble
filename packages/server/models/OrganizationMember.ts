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
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization, User } from './index.js';

@Table({ tableName: 'OrganizationMember' })
export class OrganizationMember extends Model {
  @AllowNull(false)
  @Default('Member')
  @Column(DataType.ENUM(...Object.keys(roles)))
  role: Role;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  OrganizationId: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => Organization)
  Organization: Awaited<Organization>;

  @BelongsTo(() => User)
  User: Awaited<User>;
}
