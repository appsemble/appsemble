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

import User from './User';

@Table({ tableName: 'ResetPasswordToken' })
export default class ResetPasswordToken extends Model<ResetPasswordToken> {
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
