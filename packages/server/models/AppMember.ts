import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Index,
  IsUUID,
  Model,
  PrimaryKey,
  Table,
  Unique,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, AppOAuth2Authorization, AppSamlAuthorization, User } from './index.js';
import { TeamMember } from './TeamMember.js';

@Table({ tableName: 'AppMember' })
export class AppMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  role: string;

  @Index({ name: 'UniqueAppMemberEmailIndex', type: 'UNIQUE' })
  @Column(DataType.STRING)
  email: string;

  @Default(false)
  @Column(DataType.BOOLEAN)
  emailVerified: boolean;

  @Column(DataType.STRING)
  name: string;

  @Column(DataType.STRING)
  password: string;

  @Column(DataType.STRING)
  emailKey: string;

  @Column(DataType.STRING)
  resetKey: string;

  @Column(DataType.DATE)
  consent: Date;

  @Column(DataType.BLOB)
  picture?: Buffer;

  @Column(DataType.JSON)
  properties?: Record<string, string>;

  @Column(DataType.STRING)
  scimExternalId?: string;

  @AllowNull(true)
  @Column(DataType.BOOLEAN)
  scimActive?: boolean;

  @Column(DataType.STRING)
  locale?: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Unique('UniqueAppMemberIndex')
  @Index({ name: 'UniqueAppMemberEmailIndex', type: 'UNIQUE' })
  @Column(DataType.INTEGER)
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => User)
  @Unique('UniqueAppMemberIndex')
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: Awaited<User>;

  @HasMany(() => TeamMember)
  TeamMembers: TeamMember[];

  @HasMany(() => AppOAuth2Authorization)
  AppOAuth2Authorizations: AppOAuth2Authorization[];

  @HasMany(() => AppSamlAuthorization)
  AppSamlAuthorizations: AppSamlAuthorization[];

  get hasPicture(): boolean {
    return this.get('hasPicture');
  }
}
