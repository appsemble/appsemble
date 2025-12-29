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

import { User } from '../index.js';

@Table({ tableName: 'EmailAuthorization' })
export class EmailAuthorization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare email: string;

  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  declare verified: boolean;

  @Column(DataType.STRING)
  declare key?: string;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare User?: Awaited<User>;
}
