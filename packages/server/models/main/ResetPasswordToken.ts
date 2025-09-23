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
  UpdatedAt,
} from 'sequelize-typescript';

import { User } from '../index.js';

@Table({ tableName: 'ResetPasswordToken' })
export class ResetPasswordToken extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  token!: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId!: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User?: Awaited<User>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
