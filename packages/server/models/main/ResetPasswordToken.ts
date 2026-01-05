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
  declare token: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare User?: Awaited<User>;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;
}
