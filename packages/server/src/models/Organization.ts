import {
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyHasAssociationMixin,
  HasManyRemoveAssociationMixin,
  Model,
  Sequelize,
} from 'sequelize';

import App from './App';
import Member from './Member';
import OrganizationBlockStyle from './OrganizationBlockStyle';
import OrganizationInvite from './OrganizationInvite';
import User from './User';

export default class Organization extends Model {
  id: string;

  name: string;

  coreStyle: string;

  sharedStyle: string;

  OrganizationBlockStyles: OrganizationBlockStyle[];

  Member: Member;

  Users: User[];

  OrganizationInvites: OrganizationInvite[];

  addUser: HasManyAddAssociationMixin<User, any>;

  hasUser: HasManyHasAssociationMixin<User, string>;

  removeUser: HasManyRemoveAssociationMixin<User, string>;

  static initialize(sequelize: Sequelize): void {
    Organization.init(
      {
        id: { type: DataTypes.STRING, primaryKey: true },
        name: { type: DataTypes.STRING },
        coreStyle: { type: DataTypes.TEXT },
        sharedStyle: { type: DataTypes.TEXT },
      },
      {
        sequelize,
        tableName: 'Organization',
        paranoid: true,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    Organization.hasMany(OrganizationInvite);
    Organization.hasOne(Organization);
    Organization.hasMany(App);
    Organization.belongsToMany(User, { through: Member });
    Organization.hasMany(OrganizationBlockStyle);
  }
}
