import { TeamRole } from '@appsemble/utils';
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

import { Team, User } from '.';

@Table({ tableName: 'TeamMember' })
export class TeamMember extends Model {
  @PrimaryKey
  @ForeignKey(() => Team)
  @Column
  TeamId: number;

  @PrimaryKey
  @ForeignKey(() => User)
  @Column
  UserId: string;

  @Default(TeamRole.Member)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TeamRole)))
  role: TeamRole;

  @BelongsTo(() => User)
  User: User;

  @BelongsTo(() => Team)
  Team: Team;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
