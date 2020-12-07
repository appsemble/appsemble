import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  BelongsToMany,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, TeamMember, User } from '.';

@Table({ tableName: 'Team' })
export class Team extends Model<Team> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @BelongsToMany(() => User, () => TeamMember)
  Users: User[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
