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

import { User } from './User.js';

@Table({ tableName: 'OrganizationSsoIdentity' })
export class OrganizationSsoIdentity extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  declare id: string;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  declare UserId: string;

  @AllowNull(false)
  @Index({ name: 'OrganizationSsoIdentity_issuer_subject_key', unique: true })
  @Column(DataType.TEXT)
  declare issuer: string;

  @AllowNull(false)
  @Index({ name: 'OrganizationSsoIdentity_issuer_subject_key', unique: true })
  @Column(DataType.STRING)
  declare subject: string;

  /**
   * The provider account: its email address, or its `preferred_username` without one.
   */
  @Column(DataType.TEXT)
  declare username?: string | null;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  declare User?: Awaited<User>;
}
