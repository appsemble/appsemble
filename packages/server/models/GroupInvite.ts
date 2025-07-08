import { type AppRole } from '@appsemble/lang-sdk';
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
  GroupId!: number;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  key!: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.STRING)
  role!: AppRole;

  @BelongsTo(() => Group, { onDelete: 'CASCADE' })
  Group?: Awaited<Group>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  toJSON(): { id: number; name: string } {
    // Here we assume you queried with `{ include: Group }`
    return {
      // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
      id: this.GroupId ?? this.Group.id,
      // @ts-expect-error 2532 object is possibly undefined (strictNullChecks)
      name: this.Group.name,
    };
  }
}
