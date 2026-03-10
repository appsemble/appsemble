import {
  AllowNull,
  Column,
  DataType,
  Model,
  PrimaryKey,
  type Sequelize,
  Table,
} from 'sequelize-typescript';

import { type AppMember, type AppModels } from '../index.js';

export class OAuth2AuthorizationCodeGlobal extends Model {
  declare code: string;

  declare redirectUri: string;

  declare scope: string;

  declare expires: Date;

  declare AppMemberId: string;

  declare AppMember?: Awaited<AppMember>;
}

export function createOAuth2AuthorizationCodeModel(
  sequelize: Sequelize,
): typeof OAuth2AuthorizationCodeGlobal {
  @Table({ tableName: 'OAuth2AuthorizationCode', createdAt: false, updatedAt: false })
  class OAuth2AuthorizationCode extends OAuth2AuthorizationCodeGlobal {
    @PrimaryKey
    @AllowNull(false)
    @Column(DataType.STRING)
    declare code: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare redirectUri: string;

    @AllowNull(false)
    @Column(DataType.STRING)
    declare scope: string;

    @AllowNull(false)
    @Column(DataType.DATE)
    declare expires: Date;

    @AllowNull(false)
    @Column(DataType.UUID)
    declare AppMemberId: string;

    static associate(models: AppModels): void {
      OAuth2AuthorizationCode.belongsTo(models.AppMember, {
        foreignKey: 'AppMemberId',
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      });
    }
  }

  sequelize.addModels([OAuth2AuthorizationCode]);
  return OAuth2AuthorizationCode;
}
