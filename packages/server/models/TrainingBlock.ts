import {
  AllowNull,
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

import { Training } from './Training.js';

@Table({ tableName: 'TrainingBlock' })
export class TrainingBlock extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @ForeignKey(() => Training)
  @Column(DataType.INTEGER)
  TrainingId: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  title: string;

  @Column(DataType.STRING)
  documentationLink?: string;

  @Column(DataType.STRING)
  videoLink?: string;

  @Column(DataType.TEXT)
  exampleCode?: string;

  @Column(DataType.STRING)
  externalResource?: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
