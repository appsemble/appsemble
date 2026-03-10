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
  declare id: string;

  @HasMany(() => TrainingCompleted)
  declare CompletedTrainings: TrainingCompleted[];

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
