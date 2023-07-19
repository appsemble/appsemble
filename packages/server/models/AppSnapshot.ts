import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import { App, User } from './index.js';

@Table({ tableName: 'AppSnapshot', updatedAt: false })
export class AppSnapshot extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  yaml: string;

  @CreatedAt
  created: Date;

  @ForeignKey(() => App)
  @AllowNull(false)
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  /**
   * XXX: Update this to not allow null after the migration has finished
   */
  @ForeignKey(() => User)
  @AllowNull(true)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: Awaited<User>;
}
