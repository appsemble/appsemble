import {
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

import { App, AppCollection } from './index.js';

@Table({ tableName: 'AppCollectionApp' })
export class AppCollectionApp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @ForeignKey(() => AppCollection)
  @Index({ name: 'UniqueAppCollectionAppIndex', unique: true })
  @Column(DataType.INTEGER)
  AppCollectionId: number;

  @ForeignKey(() => App)
  @Index({ name: 'UniqueAppCollectionAppIndex', unique: true })
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => AppCollection)
  AppCollection: Awaited<AppCollection>;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @Column(DataType.DATE)
  pinnedAt?: Date;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
