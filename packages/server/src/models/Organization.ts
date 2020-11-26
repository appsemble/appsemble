import {
  BelongsToMany,
  Column,
  CreatedAt,
  DeletedAt,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Member, OrganizationInvite, Team, User } from '.';

@Table({ tableName: 'Organization', paranoid: true })
export class Organization extends Model<Organization> {
  @PrimaryKey
  @Column
  id: string;

  @Column
  name: string;

  @Column
  icon: Buffer;

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

  @HasMany(() => Team)
  Teams: Team[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

  Member: Member;
}
