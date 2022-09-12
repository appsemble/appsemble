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
} from 'sequelize-typescript';

import { User } from './index.js';

@Table({ tableName: 'OAuth2ClientCredentials', updatedAt: false })
export class OAuth2ClientCredentials extends Model {
  @PrimaryKey
  @Column
  id: string;

  @AllowNull(false)
  @Column
  description: string;

  @AllowNull(false)
  @Column
  secret: string;

  @Column
  expires: Date;

  @AllowNull(false)
  @Column
  scopes: string;

  @CreatedAt
  created: Date;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User: Awaited<User>;
}
