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

import { User } from '.';

@Table({ tableName: 'ResetPasswordToken' })
export class ResetPasswordToken extends Model {
  @PrimaryKey
  @Column
  token: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User: User;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
