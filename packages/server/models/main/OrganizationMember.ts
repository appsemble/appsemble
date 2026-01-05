import { type PredefinedOrganizationRole, predefinedOrganizationRoles } from '@appsemble/types';
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

import { Organization, User } from '../index.js';

@Table({ tableName: 'OrganizationMember' })
export class OrganizationMember extends Model {
  @AllowNull(false)
  @Default('Member')
  @Column(DataType.ENUM(...predefinedOrganizationRoles))
  declare role: PredefinedOrganizationRole;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @BelongsTo(() => Organization)
  declare Organization?: Awaited<Organization>;

  @BelongsTo(() => User)
  declare User?: Awaited<User>;
}
