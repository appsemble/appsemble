import { type TeamMember } from '@appsemble/types';
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

import { Team } from './index.js';

@Table({ tableName: 'TeamInvite' })
export class TeamInvite extends Model {
  @PrimaryKey
  @ForeignKey(() => Team)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  TeamId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  email: string;

  @AllowNull(false)
  @Default(TeamRole.Member)
  @Column(DataType.ENUM(...Object.values(TeamRole)))
  role: TeamRole;

  @AllowNull(false)
  @Column(DataType.STRING)
  key: string;

  @BelongsTo(() => Team)
  Team: Awaited<Team>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  toJSON(): TeamMember {
    return {
      role: this.role,
      id: this.TeamId ?? this.Team.id,
      name: this.Team.name,
    };
  }
}
