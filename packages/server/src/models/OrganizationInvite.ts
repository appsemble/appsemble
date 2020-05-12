import { DataTypes, HasOneGetAssociationMixin, Model, Sequelize } from 'sequelize';

import Organization from './Organization';
import User from './User';

export default class OrganizationInvite extends Model {
  email: string;

  key: string;

  UserId: string;

  OrganizationId: string;

  getUser: HasOneGetAssociationMixin<User>;

  static initialize(sequelize: Sequelize): void {
    OrganizationInvite.init(
      {
        email: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
        key: { type: DataTypes.STRING, allowNull: false },
        UserId: { type: DataTypes.UUID, unique: 'EmailOrganizationIndex' },
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
