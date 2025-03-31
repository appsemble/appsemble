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

import { AppMember, AppSamlSecret } from './index.js';

@Table({ tableName: 'AppSamlAuthorization' })
export class AppSamlAuthorization extends Model {
  /**
   * The name id of the user on the identity provider.
   */
  @PrimaryKey
  @Column(DataType.STRING)
  nameId!: string;

  /**
   * The email used on the SAML provider.
   */
  @AllowNull(false)
  @Column(DataType.STRING)
  email!: string;

  /**
   * Whether the linked email is verified on the SAML provider.
   */
  @Default(false)
  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  emailVerified!: boolean;

  /**
   * The id of the linked app SAML secret.
   */
  @PrimaryKey
  @ForeignKey(() => AppSamlSecret)
  @Column(DataType.INTEGER)
  AppSamlSecretId!: number;

  /**
   * The linked app SAML secret.
   */
  @BelongsTo(() => AppSamlSecret, { onDelete: 'CASCADE' })
  AppSamlSecret?: Awaited<AppSamlSecret>;

  /**
   * The id of the linked app user.
   */
  @ForeignKey(() => AppMember)
  @Column(DataType.UUID)
  AppMemberId?: string;

  /**
   * The app user.
   */
  @BelongsTo(() => AppMember)
  AppMember?: Awaited<AppMember>;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;
}
