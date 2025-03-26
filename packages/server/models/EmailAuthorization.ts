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

import { User } from './index.js';

@Table({ tableName: 'EmailAuthorization' })
export class EmailAuthorization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  email!: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  verified!: boolean;

  @Column(DataType.STRING)
  key?: string;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId!: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User?: Awaited<User>;
}
