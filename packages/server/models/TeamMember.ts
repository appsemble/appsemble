import { TeamMemberRole } from '@appsemble/utils';
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

import { AppMember } from './AppMember.js';
import { Team } from './Team.js';

@Table({ tableName: 'TeamMember' })
export class TeamMember extends Model {
  @PrimaryKey
  @ForeignKey(() => Team)
  @Column(DataType.INTEGER)
  TeamId: number;

  @PrimaryKey
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId: string;

  @Default(TeamMemberRole.Member)
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.values(TeamMemberRole)))
  role: TeamMemberRole;

  @BelongsTo(() => AppMember)
  AppMember: Awaited<AppMember>;

  @BelongsTo(() => Team)
  Team: Awaited<Team>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
