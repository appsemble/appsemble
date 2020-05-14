import { DataTypes, Model, Sequelize } from 'sequelize';

import App from './App';
import User from './User';

export default class OAuth2AuthorizationCode extends Model {
  code: string;

  redirectUri: string;

  expires: Date;

  UserId: string;

  static initialize(sequelize: Sequelize): void {
    OAuth2AuthorizationCode.init(
      {
        code: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
        redirectUri: { type: DataTypes.STRING, allowNull: false },
        expires: { type: DataTypes.DATE, allowNull: false },
      },
      {
        sequelize,
        tableName: 'OAuth2AuthorizationCode',
        paranoid: false,
        createdAt: false,
        updatedAt: false,
      },
    );
  }

  static associate(): void {
    OAuth2AuthorizationCode.belongsTo(User, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
    OAuth2AuthorizationCode.belongsTo(App, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
    App.hasMany(OAuth2AuthorizationCode);
  }
}
