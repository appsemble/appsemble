import {
  DataTypes,
  HasManyAddAssociationMixin,
  HasManyCreateAssociationMixin,
  HasManyRemoveAssociationMixin,
  Model,
  Sequelize,
} from 'sequelize';

import App from './App';
import AppMember from './AppMember';
import EmailAuthorization from './EmailAuthorization';
import Member from './Member';
import OAuthAuthorization from './OAuthAuthorization';
import Organization from './Organization';
import ResetPasswordToken from './ResetPasswordToken';

export default class User extends Model {
  id: number;

  name: string;

  primaryEmail: string;

  password: string;

  AppMember: AppMember;

  Member: Member;

  Organizations: Organization[];

  EmailAuthorizations: EmailAuthorization[];

  OAuthAuthorizations: OAuthAuthorization[];

  createOrganization: HasManyCreateAssociationMixin<Organization>;

  addOAuthAuthorization: HasManyAddAssociationMixin<OAuthAuthorization, number>;

  removeEmailAuthorizations: HasManyRemoveAssociationMixin<EmailAuthorization, number>;

  static initialize(sequelize: Sequelize): void {
    User.init(
      {
        id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
        name: { type: DataTypes.STRING },
        password: { type: DataTypes.STRING },
      },
      {
        sequelize,
        tableName: 'User',
        paranoid: true,
        createdAt: 'created',
        updatedAt: 'updated',
        deletedAt: 'deleted',
      },
    );
  }

  static associate(): void {
    User.belongsToMany(Organization, { through: Member, foreignKey: { allowNull: false } });
    User.belongsToMany(App, { through: AppMember });
    User.hasMany(OAuthAuthorization);
    User.hasMany(EmailAuthorization);
    User.hasMany(ResetPasswordToken, {
      foreignKey: { allowNull: false },
      onDelete: 'CASCADE',
    });
    User.belongsTo(EmailAuthorization, {
      foreignKey: 'primaryEmail',
      constraints: false,
    });
  }
}
