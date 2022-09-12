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

import { AppMember, AppSamlSecret } from './index.js';

@Table({ tableName: 'AppSamlAuthorization' })
export class AppSamlAuthorization extends Model {
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
  AppSamlSecret: Awaited<AppSamlSecret>;

  /**
   * The id of the linked app user.
   */
  @ForeignKey(() => AppMember)
  @AllowNull(false)
  @Column(DataType.UUID)
  AppMemberId: string;

  /**
   * The app user.
   */
  @BelongsTo(() => AppMember)
  AppMember: Awaited<AppMember>;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
