import {
  AllowNull,
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

import { App, User } from '../index.js';

@Table({ tableName: 'AppRating' })
export class AppRating extends Model {
  @AllowNull(false)
  @Column(DataType.INTEGER)
  declare rating: number;

  @Column(DataType.TEXT)
  declare description?: string;

  @PrimaryKey
  @AllowNull(false)
  @Index({ name: 'UniqueRatingIndex', unique: true })
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  declare AppId: number;

  @BelongsTo(() => App)
  declare App?: Awaited<App>;

  @PrimaryKey
  @AllowNull(false)
  @Index({ name: 'UniqueRatingIndex', unique: true })
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @BelongsTo(() => User)
  declare User?: Awaited<User>;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  declare RatingAverage?: number;

  declare RatingCount?: number;
}
