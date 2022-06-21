import {
  AllowNull,
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

import { App, User } from '.';

@Table({ tableName: 'AppRating' })
export class AppRating extends Model {
  @AllowNull(false)
  @Column
  rating: number;

  @Column(DataType.TEXT)
  description: string;

  @PrimaryKey
  @AllowNull(false)
  @Unique('UniqueRatingIndex')
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @PrimaryKey
  @AllowNull(false)
  @Unique('UniqueRatingIndex')
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  RatingAverage?: number;
  RatingCount?: number;
}
