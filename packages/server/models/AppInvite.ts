import { type AppRole } from '@appsemble/types';
import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, User } from './index.js';

@Table({ tableName: 'AppInvite' })
export class AppInvite extends Model {
  @PrimaryKey
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  key!: string;

  @Default('Member')
  @AllowNull(false)
  @Column(DataType.STRING)
  role!: AppRole;

  @ForeignKey(() => User)
  @Index({ name: 'AppInvite_UserId_AppId_key', unique: true })
  @Column(DataType.UUID)
  UserId?: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User?: Awaited<User>;

  @PrimaryKey
  @ForeignKey(() => App)
  @Index({ name: 'AppInvite_UserId_AppId_key', unique: true })
  @Column(DataType.INTEGER)
  AppId!: number;

  @BelongsTo(() => App, { onDelete: 'CASCADE' })
  app?: Awaited<App>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
