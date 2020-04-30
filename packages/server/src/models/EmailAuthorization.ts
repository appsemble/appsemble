import { DataTypes, HasOneCreateAssociationMixin, Model, Sequelize } from 'sequelize';

import User from './User';

export default class EmailAuthorization extends Model {
  email: string;

  verified: boolean;

  key: string;

  UserId: number;

  User: User;

  createUser: HasOneCreateAssociationMixin<User>;

  static initialize(sequelize: Sequelize): void {
    EmailAuthorization.init(
      {
        email: { type: DataTypes.STRING, primaryKey: true },
        verified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        key: DataTypes.STRING,
      },
      {
        sequelize,
        tableName: 'EmailAuthorization',
        paranoid: false,
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    EmailAuthorization.belongsTo(User);
  }
}
