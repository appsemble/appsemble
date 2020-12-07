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

import { AppSamlSecret, User } from '.';

@Table({ tableName: 'AppSamlAuthorization' })
export class AppSamlAuthorization extends Model<AppSamlAuthorization> {
  /**
   * The name id of the user on the identity provider.
   */
  @PrimaryKey
  @Column
  nameId: string;

  /**
   * The id of the linked app SAML secret.
   */
  @PrimaryKey
  @ForeignKey(() => AppSamlSecret)
  @Column
  AppSamlSecretId: number;

  /**
   * The linked app SAML secret.
   */
  @BelongsTo(() => AppSamlSecret)
  AppSamlSecret: AppSamlSecret;

  /**
   * The id of the linked Appsemble user.
   */
  @ForeignKey(() => User)
  @AllowNull(false)
  @Column(DataType.UUID)
  UserId: string;

  /**
   * The Appsemble user.
   */
  @BelongsTo(() => User)
  User: User;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
