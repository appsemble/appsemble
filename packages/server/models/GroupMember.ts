import { type AppRole } from '@appsemble/lang-sdk';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppMember } from './AppMember.js';
import { Group } from './Group.js';

@Table({ tableName: 'GroupMember' })
export class GroupMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  role!: AppRole;

  @PrimaryKey
  @ForeignKey(() => Group)
  @Column(DataType.INTEGER)
  GroupId!: number;

  @PrimaryKey
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId!: string;

  @BelongsTo(() => AppMember)
  AppMember?: Awaited<AppMember>;

  @BelongsTo(() => Group)
  Group?: Awaited<Group>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
