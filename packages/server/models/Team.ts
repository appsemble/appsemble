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

import { App, TeamMember } from './index.js';

@Table({ tableName: 'Team' })
export class Team extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @Column(DataType.JSON)
  annotations: Record<string, string>;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @HasMany(() => TeamMember)
  Members: TeamMember[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
