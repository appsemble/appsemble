import { DataTypes, Model, Sequelize } from 'sequelize';

import Organization from './Organization';
import User from './User';

export default class OrganizationInvite extends Model {
  static initialize(sequelize: Sequelize): void {
    OrganizationInvite.init(
      {
        email: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
        key: { type: DataTypes.STRING, allowNull: false },
        UserId: { type: DataTypes.INTEGER, unique: 'EmailOrganizationIndex' },
        OrganizationId: {
          type: DataTypes.STRING,
          unique: 'EmailOrganizationIndex',
          primaryKey: true,
        },
      },
      {
        sequelize,
        tableName: 'OrganizationInvite',
        createdAt: 'created',
        updatedAt: 'updated',
      },
    );
  }

  static associate(): void {
    OrganizationInvite.belongsTo(Organization);
    OrganizationInvite.belongsTo(User);
  }
}
