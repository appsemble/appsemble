import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import App from './App';
import Member from './Member';
import OrganizationBlockStyle from './OrganizationBlockStyle';
import OrganizationInvite from './OrganizationInvite';
import User from './User';

@Table({ tableName: 'Organization', paranoid: true })
export default class Organization extends Model<Organization> {
  @PrimaryKey
  @Column
  id: string;

  @Column
  name: string;

  @Column(DataType.TEXT)
  coreStyle: string;

  @Column(DataType.TEXT)
  sharedStyle: string;

  @HasMany(() => OrganizationBlockStyle)
  OrganizationBlockStyles: OrganizationBlockStyle[];

  Member: Member;

  @BelongsToMany(() => User, () => Member)
  Users: User[];

  @HasMany(() => Organization)
  Organizations: Organization[];

  @HasMany(() => OrganizationInvite)
  OrganizationInvites: OrganizationInvite[];

  @ForeignKey(() => Organization)
  @Column
  OrganizationId: string;

  @HasOne(() => Organization)
  Organization: Organization;

  @HasMany(() => App)
  Apps: App[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;
}
