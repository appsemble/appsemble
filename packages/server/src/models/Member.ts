import { Role, roles } from '@appsemble/utils';
import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization, User } from '.';

@Table({ tableName: 'Member' })
export default class Member extends Model<Member> {
  @Default('Member')
  @Column(DataType.ENUM(...Object.keys(roles)))
  role: Role;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Column
  OrganizationId: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column
  UserId: number;
}
