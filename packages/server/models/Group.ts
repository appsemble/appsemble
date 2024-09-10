import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, GroupMember } from './index.js';

@Table({ tableName: 'Group' })
export class Group extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.JSON)
  annotations: Record<string, string>;

  @Column(DataType.ARRAY(DataType.STRING))
  roles: string[];

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @HasMany(() => GroupMember)
  Members: GroupMember[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
