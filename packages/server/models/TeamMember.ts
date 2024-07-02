import { type TeamMemberRole, teamMemberRoles } from '@appsemble/utils';
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
import { Team } from './Team.js';

@Table({ tableName: 'TeamMember' })
export class TeamMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @PrimaryKey
  @ForeignKey(() => Team)
  @Column(DataType.INTEGER)
  TeamId: number;

  @PrimaryKey
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.ENUM(...Object.keys(teamMemberRoles)))
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
