import { type AppRole } from '@appsemble/types';
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
  UpdatedAt,
} from 'sequelize-typescript';

import { Group } from './index.js';

@Table({ tableName: 'GroupInvite' })
export class GroupInvite extends Model {
  @PrimaryKey
  @ForeignKey(() => Group)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  GroupId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  key: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.STRING)
  role: AppRole;

  @BelongsTo(() => Group, { onDelete: 'CASCADE' })
  Group: Awaited<Group>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  toJSON(): { id: number; name: string } {
    return {
      id: this.GroupId ?? this.Group.id,
      name: this.Group.name,
    };
  }
}
