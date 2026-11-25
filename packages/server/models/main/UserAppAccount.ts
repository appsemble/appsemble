import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from './App.js';
import { User } from './User.js';

/**
 * An app in which a user has an app member account.
 *
 * App members live in the database of their app, so this lets the app accounts of a user be found
 * without opening the database of every app.
 */
@Table({ tableName: 'UserAppAccount' })
export class UserAppAccount extends Model {
  @PrimaryKey
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @PrimaryKey
  @ForeignKey(() => App)
  @Column(DataType.INTEGER)
  declare AppId: number;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare User?: Awaited<User>;

  @BelongsTo(() => App, { onDelete: 'CASCADE' })
  declare App?: Awaited<App>;
}
