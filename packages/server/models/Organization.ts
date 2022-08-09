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

import { App, BlockVersion, Member, OrganizationInvite, User } from './index.js';

@Table({ tableName: 'Organization', paranoid: true })
export class Organization extends Model {
  @PrimaryKey
  @Column
  id: string;

  @Column
  name: string;

  @Column
  description: string;

  @Column
  website: string;

  @Column
  email: string;

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

  @HasMany(() => BlockVersion)
  BlockVersions: BlockVersion[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

  Member: Member;
}
