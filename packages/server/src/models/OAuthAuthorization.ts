import { DataTypes, HasOneCreateAssociationMixin, Model, Sequelize } from 'sequelize';

import User from './User';

export default class OAuthAuthorization extends Model {
  id: string;

  provider: string;

  token: string;

  expiresAt: Date;

  refreshToken: string;

  code: string;

  UserId: number;

  User: string;

  createUser: HasOneCreateAssociationMixin<User>;

  static initialize(sequelize: Sequelize): void {
    OAuthAuthorization.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        provider: { type: DataTypes.STRING, primaryKey: true },
        token: { type: DataTypes.TEXT, allowNull: false },
        expiresAt: { type: DataTypes.DATE, allowNull: true },
        refreshToken: { type: DataTypes.TEXT, allowNull: true },
        code: { type: DataTypes.TEXT, allowNull: true },
      },
      {
        sequelize,
        tableName: 'OAuthAuthorization',
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    OAuthAuthorization.belongsTo(User);
  }
}
