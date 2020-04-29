import { DataTypes, Model, Sequelize } from 'sequelize';

import User from './User';

export default class OAuth2ClientCredentials extends Model {
  static initialize(sequelize: Sequelize): void {
    OAuth2ClientCredentials.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        description: { type: DataTypes.STRING, allowNull: false },
        secret: { type: DataTypes.STRING, allowNull: false },
        expires: { type: DataTypes.DATE },
        scopes: { type: DataTypes.STRING, allowNull: false },
      },
      {
        sequelize,
        tableName: 'OAuth2ClientCredentials',
        paranoid: false,
        createdAt: 'created',
        updatedAt: false,
      },
    );
  }

  static associate(): void {
    OAuth2ClientCredentials.belongsTo(User, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
  }
}
