import { roles } from '@appsemble/utils';
import { DataTypes, Model, Sequelize } from 'sequelize';

export default class Member extends Model {
  static initialize(sequelize: Sequelize): void {
    Member.init(
      {
        role: {
          type: DataTypes.ENUM(...Object.keys(roles)),
          defaultValue: 'Member',
        },
      },
      {
        sequelize,
        tableName: 'Member',
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }
}
