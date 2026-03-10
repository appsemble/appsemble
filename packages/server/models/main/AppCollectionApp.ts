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

import { App, AppCollection } from '../index.js';

@Table({ tableName: 'AppCollectionApp' })
export class AppCollectionApp extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  // TODO: make non-nullable
  @ForeignKey(() => AppCollection)
  @Index({ name: 'UniqueAppCollectionAppIndex', unique: true })
  @Column(DataType.INTEGER)
  declare AppCollectionId?: number;

  // TODO: make non-nullable
  @ForeignKey(() => App)
  @Index({ name: 'UniqueAppCollectionAppIndex', unique: true })
  @Column(DataType.INTEGER)
  declare AppId?: number;

  @BelongsTo(() => AppCollection)
  declare AppCollection?: Awaited<AppCollection>;

  @BelongsTo(() => App, { onDelete: 'CASCADE' })
  declare App?: Awaited<App>;

  @Column(DataType.DATE)
  declare pinnedAt?: Date;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
