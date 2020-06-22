import {
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
  App,
  AppMember,
  Asset,
  EmailAuthorization,
  Member,
  OAuth2AuthorizationCode,
  OAuthAuthorization,
  Organization,
  ResetPasswordToken,
} from '.';

@Table({ tableName: 'User', paranoid: true })
export default class User extends Model<User> {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @Column
  name: string;

  @ForeignKey(() => EmailAuthorization)
  @Column
  primaryEmail: string;

  @Column
  password: string;

  AppMember: AppMember;

  Member: Member;

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

  @BelongsToMany(() => App, () => AppMember)
  Apps: App[];

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;
}
