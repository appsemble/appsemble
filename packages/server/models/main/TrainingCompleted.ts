import {
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { User } from './User.js';

@Table({ tableName: 'TrainingCompleted' })
export class TrainingCompleted extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare TrainingId: string;

  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
