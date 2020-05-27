import { DataTypes, Model, Sequelize } from 'sequelize';

import User from './User';

export default class OAuthAuthorization extends Model {
  /**
   * The subject id of the user on the remote authorization server.
   */
  sub: string;

  /**
   * The authorization URL where the user needs to approve Appsemble to access their account.
   */
  authorizationUrl: string;

  /**
   * The access token assigned to Appsemble linked to the subject.
   */
  accessToken: string;

  /**
   * The expiration date of the access token.
   */
  expiresAt: Date;

  /**
   * The refresh token that may be used to refresh the access token.
   */
  refreshToken: string;

  /**
   * A short lived authorization code that’s used during the login process.
   */
  code: string;

  /**
   * The id of the linked Appsemble user.
   */
  UserId: string;

  /**
   * The Appsemble user.
   */
  User: string;

  static initialize(sequelize: Sequelize): void {
    OAuthAuthorization.init(
      {
        sub: { type: DataTypes.STRING, primaryKey: true },
        authorizationUrl: { type: DataTypes.STRING, primaryKey: true },
        accessToken: { type: DataTypes.TEXT, allowNull: false },
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
