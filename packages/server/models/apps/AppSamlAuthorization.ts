import {
  AllowNull,
  Column,
  CreatedAt,
  DataType,
  Default,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { type AppMember, type AppModels, type AppSamlSecret } from '../index.js';

export class AppSamlAuthorizationGlobal extends Model {
  /**
   * The name id of the user on the identity provider.
   */
  nameId!: string;

  /**
   * The email used on the SAML provider.
   */
  email!: string;

  /**
   * Whether the linked email is verified on the SAML provider.
   */
  emailVerified!: boolean;

  created!: Date;

  updated!: Date;

  AppSamlSecretId!: number;

  AppMemberId?: string;

  AppSamlSecret?: Awaited<AppSamlSecret>;

  AppMember?: Awaited<AppMember>;
}

export function createAppSamlAuthorizationModel(
  sequelize: Sequelize,
): typeof AppSamlAuthorizationGlobal {
  @Table({ tableName: 'AppSamlAuthorization' })
  class AppSamlAuthorization extends AppSamlAuthorizationGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    nameId!: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    email!: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    emailVerified!: boolean;

    @CreatedAt
    created!: Date;

    @UpdatedAt
    updated!: Date;

    @PrimaryKey
    @Column(DataType.INTEGER)
    AppSamlSecretId!: number;

    @Column(DataType.UUID)
    AppMemberId?: string;

    static associate(models: AppModels): void {
      AppSamlAuthorization.belongsTo(models.AppSamlSecret, {
        foreignKey: 'AppSamlSecretId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
      AppSamlAuthorization.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([AppSamlAuthorization]);
  return AppSamlAuthorization;
}
