import {
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { TrainingCompleted } from './TrainingCompleted.js';

@Table({ tableName: 'Training' })
export class Training extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @HasMany(() => TrainingCompleted)
  CompletedTrainings!: TrainingCompleted[];

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
