import type { AppDefinition } from '@appsemble/types';
import {
  DataTypes,
  HasManyGetAssociationsMixin,
  HasManyRemoveAssociationMixin,
  Model,
  Sequelize,
} from 'sequelize';

import AppBlockStyle from './AppBlockStyle';
import AppMember from './AppMember';
import AppSubscription from './AppSubscription';
import Asset from './Asset';
import Organization from './Organization';
import OrganizationBlockStyle from './OrganizationBlockStyle';
import Resource from './Resource';
import User from './User';

export default class App extends Model {
  id: number;

  definition: AppDefinition;

  domain: string;

  icon: Buffer;

  path: string;

  private: boolean;

  template: boolean;

  style: string;

  sharedStyle: string;

  yaml: string;

  vapidPublicKey: string;

  vapidPrivateKey: string;

  updated: Date;

  created: Date;

  OrganizationId: string;

  AppBlockStyles: AppBlockStyle[];

  Organization: Organization;

  Assets: Asset[];

  Users: User[];

  Resources: Resource[];

  ResourceCount: number;

  getUsers: HasManyGetAssociationsMixin<User>;

  removeUser: HasManyRemoveAssociationMixin<User, number>;

  RatingAverage?: number;

  RatingCount?: number;

  dataValues?: App;

  static initialize(sequelize: Sequelize): void {
    App.init(
      {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        definition: { type: DataTypes.JSON, allowNull: false },
        /**
         * The maximum length of a domain name is 255 bytes as per
         * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
         * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
         */
        domain: { type: DataTypes.STRING(253), allowNull: true },
        icon: { type: DataTypes.BLOB },
        path: { type: DataTypes.STRING, unique: 'UniquePathIndex', allowNull: true },
        private: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        template: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
        style: { type: DataTypes.TEXT },
        sharedStyle: { type: DataTypes.TEXT },
        yaml: { type: DataTypes.TEXT },
        vapidPublicKey: { type: DataTypes.STRING, allowNull: false },
        vapidPrivateKey: { type: DataTypes.STRING, allowNull: false },
        OrganizationId: {
          type: DataTypes.STRING,
          unique: 'UniquePathIndex',
          allowNull: false,
        },
      },
      {
        sequelize,
        tableName: 'App',
        paranoid: true,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    App.hasMany(Resource);
    App.belongsTo(Organization, { foreignKey: { allowNull: false } });
    App.belongsToMany(User, { through: AppMember });
    App.hasMany(AppSubscription);
    App.hasMany(Asset);
    App.hasMany(AppBlockStyle);
    App.hasMany(OrganizationBlockStyle);
  }
}
