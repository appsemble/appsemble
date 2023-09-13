import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  Unique,
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
  @Unique('UniqueAppCollectionAppIndex')
  @Column(DataType.INTEGER)
  AppCollectionId: number;

  @ForeignKey(() => App)
  @Unique('UniqueAppCollectionAppIndex')
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
