import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from './index.js';

@Table({ tableName: 'AppVariable' })
export class AppVariable extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Index({ name: 'UniqueNameIndex', unique: true })
  @Column(DataType.STRING)
  name!: string;

  @Column(DataType.STRING)
  value?: string;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Index({ name: 'UniqueNameIndex', unique: true })
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
