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
  declare nameId: string;

  /**
   * The email used on the SAML provider.
   */
  declare email: string;

  /**
   * Whether the linked email is verified on the SAML provider.
   */
  declare emailVerified: boolean;

  declare created: Date;

  declare updated: Date;

  declare AppSamlSecretId: number;

  declare AppMemberId?: string;

  declare AppSamlSecret?: Awaited<AppSamlSecret>;

  declare AppMember?: Awaited<AppMember>;
}

export function createAppSamlAuthorizationModel(
  sequelize: Sequelize,
): typeof AppSamlAuthorizationGlobal {
  @Table({ tableName: 'AppSamlAuthorization' })
  class AppSamlAuthorization extends AppSamlAuthorizationGlobal {
    @PrimaryKey
    @Column(DataType.STRING)
    declare nameId: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare email: string;

    @Default(false)
    @AllowNull(false)
    @Column(DataType.BOOLEAN)
    declare emailVerified: boolean;

    @CreatedAt
    declare created: Date;

    @UpdatedAt
    declare updated: Date;

    @PrimaryKey
    @Column(DataType.INTEGER)
    declare AppSamlSecretId: number;

    @Column(DataType.UUID)
    declare AppMemberId?: string;

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
