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

import { App, User } from './index.js';

@Table({ tableName: 'AppRating' })
export class AppRating extends Model {
  @AllowNull(false)
  @Column(DataType.INTEGER)
  rating!: number;

  @Column(DataType.TEXT)
  description?: string;

  @PrimaryKey
  @AllowNull(false)
  @Index({ name: 'UniqueRatingIndex', unique: true })
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App)
  App?: Awaited<App>;

  @PrimaryKey
  @AllowNull(false)
  @Index({ name: 'UniqueRatingIndex', unique: true })
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId!: string;

  @BelongsTo(() => User)
  User?: Awaited<User>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  RatingAverage?: number;

  RatingCount?: number;
}
