import { type Training as TrainingType } from '@appsemble/types';
import { omit } from 'lodash-es';
import {
  AllowNull,
  AutoIncrement,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { TrainingBlock } from './TrainingBlock.js';
import { User } from './User.js';
import { UserTraining } from './UserTraining.js';

@Table({ tableName: 'Training' })
export class Training extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  title: string;

  @Column(DataType.TEXT)
  description: string;

  @Column(DataType.STRING)
  competence: string;

  @Column(DataType.INTEGER)
  difficultyLevel: number;

  @BelongsToMany(() => User, () => UserTraining)
  Users: User[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @HasMany(() => TrainingBlock)
  TrainingBlocks: TrainingBlock[];

  /**
   * Normalizes a training record for consistent return values.
   *
   * @param omittedValues A list of fields to omit from the result.
   * @returns A training resource that can be safely returned from the API.
   */

  toJSON(omittedValues: (keyof TrainingType)[] = []): TrainingType {
    const result: TrainingType = {
      id: this.id,
      title: this.title,
      description: this.description || '',
      competence: this.competence,
      difficultyLevel: this.difficultyLevel,
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
    };
    return omit(result, omittedValues) as TrainingType;
  }
}
