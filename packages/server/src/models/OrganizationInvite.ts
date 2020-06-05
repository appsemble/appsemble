import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import Organization from './Organization';
import User from './User';

@Table({ tableName: 'OrganizationInvite' })
export default class OrganizationInvite extends Model<OrganizationInvite> {
  @PrimaryKey
  @AllowNull(false)
  @Column
  email: string;

  @AllowNull(false)
  @Column
  key: string;

  @ForeignKey(() => User)
  @Unique('EmailOrganizationIndex')
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;

  @PrimaryKey
  @ForeignKey(() => Organization)
  @Unique('EmailOrganizationIndex')
  @Column
  OrganizationId: string;

  @BelongsTo(() => Organization)
  organization: Organization;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
