import {
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  App,
  AppCollection,
  BlockVersion,
  OrganizationInvite,
  OrganizationMember,
  User,
} from '../index.js';

@Table({ tableName: 'Organization', paranoid: true })
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @Column(DataType.STRING)
  name?: string;

  @Column(DataType.STRING)
  description?: string;

  @Column(DataType.STRING)
  website?: string;

  @Column(DataType.STRING)
  email?: string;

  @Column(DataType.BLOB)
  icon?: Buffer;

  @BelongsToMany(() => User, () => OrganizationMember)
  Users!: User[];

  @HasMany(() => OrganizationInvite)
  OrganizationInvites!: OrganizationInvite[];

  @HasMany(() => App)
  Apps!: App[];

  @HasMany(() => AppCollection)
  AppCollections!: AppCollection[];

  @HasMany(() => BlockVersion)
  BlockVersions!: BlockVersion[];

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  @DeletedAt
  deleted?: Date;

  OrganizationMember?: Awaited<OrganizationMember>;
}
