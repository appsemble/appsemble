import {
  AllowNull,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  ForeignKey,
  HasMany,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  AppMember,
  EmailAuthorization,
  OAuth2AuthorizationCode,
  OAuthAuthorization,
  Organization,
  OrganizationMember,
  ResetPasswordToken,
  Training,
  UserTraining,
} from './index.js';

@Table({ tableName: 'User', paranoid: true })
export class User extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column(DataType.STRING)
  name: string;

  @ForeignKey(() => EmailAuthorization)
  @Column(DataType.STRING)
  primaryEmail: string;

  @Column(DataType.STRING)
  password: string;

  @Column(DataType.STRING)
  locale: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  timezone: string;

  @AllowNull(false)
  @Default(true)
  @Column(DataType.BOOLEAN)
  subscribed: boolean;

  /**
   * Whether this user is created by the demo login feature.
   */
  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  demoLoginUser: boolean;

  @BelongsToMany(() => Organization, () => OrganizationMember)
  Organizations: Organization[];

  @BelongsToMany(() => Training, () => UserTraining)
  Trainings: Training[];

  @HasMany(() => EmailAuthorization)
  EmailAuthorizations: EmailAuthorization[];

  @HasMany(() => OAuth2AuthorizationCode)
  OAuth2AuthorizationCodes: OAuth2AuthorizationCode[];

  @HasMany(() => OAuthAuthorization)
  OAuthAuthorizations: OAuthAuthorization[];

  @HasMany(() => ResetPasswordToken, { onDelete: 'CASCADE' })
  ResetPasswordTokens: ResetPasswordToken[];

  @HasMany(() => AppMember)
  AppMembers: AppMember[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

  AppMember: AppMember;

  OrganizationMember: OrganizationMember;
}
