import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, TeamMember, User } from './index.js';

@Table({ tableName: 'Team' })
export class Team extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @Column(DataType.JSON)
  annotations: Record<string, string>;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @BelongsToMany(() => User, () => TeamMember)
  Users: User[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
