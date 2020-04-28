import { DataTypes, Model, Sequelize } from 'sequelize';

import App from './App';
import User from './User';

export default class Asset extends Model {
  id: number;

  mime: string;

  filename: string;

  data: Buffer;

  UserId: number;

  static initialize(sequelize: Sequelize): void {
    Asset.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        mime: { type: DataTypes.STRING, allowNull: true },
        filename: { type: DataTypes.STRING, allowNull: true },
        data: { type: DataTypes.BLOB, allowNull: false },
      },
      {
        sequelize,
        tableName: 'Asset',
        paranoid: true,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    Asset.belongsTo(User, { foreignKey: { allowNull: true } });
    Asset.belongsTo(App);
  }
}
