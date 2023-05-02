import { type TeamMember } from '@appsemble/types';
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
  @Column
  TeamId: number;

  @PrimaryKey
  @AllowNull(false)
  @Column
  email: string;

  @AllowNull(false)
  @Default('member')
  @Column(DataType.STRING)
  role: TeamMember['role'];

  @AllowNull(false)
  @Column
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
