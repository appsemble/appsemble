import { DataTypes, Model, Sequelize } from 'sequelize';

export default class AppMember extends Model {
  static initialize(sequelize: Sequelize): void {
    AppMember.init(
      {
        role: { type: DataTypes.STRING, allowNull: false },
      },
      {
        sequelize,
        tableName: 'AppMember',
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }
}
