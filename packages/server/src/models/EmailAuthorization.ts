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

import User from './User';

@Table({ tableName: 'EmailAuthorization' })
export default class EmailAuthorization extends Model<EmailAuthorization> {
  @PrimaryKey
  @Column
  email: string;

  @Default(false)
  @AllowNull(false)
  @Column
  verified: boolean;

  @Column
  key: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;
}
