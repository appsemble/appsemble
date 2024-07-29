import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppMember } from './index.js';

@Table({ tableName: 'EmailAuthorization' })
export class EmailAuthorization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  email: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  verified: boolean;

  @Column(DataType.STRING)
  key: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @AllowNull(false)
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId: string;

  @BelongsTo(() => AppMember)
  AppMember: Awaited<AppMember>;
}
