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
  Asset,
  EmailAuthorization,
  Member,
  OAuth2AuthorizationCode,
  OAuthAuthorization,
  Organization,
  ResetPasswordToken,
  TeamMember,
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

  @BelongsToMany(() => Organization, () => Member)
  Organizations: Organization[];

  @HasMany(() => EmailAuthorization)
  EmailAuthorizations: EmailAuthorization[];

  @HasMany(() => OAuth2AuthorizationCode)
  OAuth2AuthorizationCodes: OAuth2AuthorizationCode[];

  @HasMany(() => OAuthAuthorization)
  OAuthAuthorizations: OAuthAuthorization[];

  @HasMany(() => ResetPasswordToken, { onDelete: 'CASCADE' })
  ResetPasswordTokens: ResetPasswordToken[];

  @HasMany(() => Asset)
  Asset: Asset[];

  @HasMany(() => AppMember)
  AppMembers: AppMember[];

  @HasMany(() => TeamMember)
  TeamMembers: TeamMember[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

  TeamMember: Awaited<TeamMember>;

  AppMember: Awaited<AppMember>;

  Member: Awaited<Member>;
}
