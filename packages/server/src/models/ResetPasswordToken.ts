import { DataTypes, Model, Sequelize } from 'sequelize';

import User from './User';

export default class ResetPasswordToken extends Model {
  static initialize(sequelize: Sequelize): void {
    ResetPasswordToken.init(
      {
        token: { type: DataTypes.STRING, primaryKey: true },
      },
      {
        sequelize,
        tableName: 'ResetPasswordToken',
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    ResetPasswordToken.belongsTo(User, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
  }
}
