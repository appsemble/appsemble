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

import { Team, User } from './index.js';

@Table({ tableName: 'TeamMember' })
export class TeamMember extends Model {
  @PrimaryKey
  @ForeignKey(() => Team)
  @Column(DataType.INTEGER)
  TeamId: number;

  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @Default(TeamRole.Member)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TeamRole)))
  role: TeamRole;

  @BelongsTo(() => User)
  User: Awaited<User>;

  @BelongsTo(() => Team)
  Team: Awaited<Team>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
