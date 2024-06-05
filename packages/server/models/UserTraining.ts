import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Training } from './Training.js';
import { User } from './User.js';

@Table({ tableName: 'UserTraining' })
export class UserTraining extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @AllowNull(false)
  @ForeignKey(() => Training)
  @Column(DataType.INTEGER)
  TrainingId: number;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  completed: boolean;

  @BelongsTo(() => Training, { onDelete: 'CASCADE' })
  Training: Awaited<Training>;

  @BelongsTo(() => User)
  User: Awaited<User>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
