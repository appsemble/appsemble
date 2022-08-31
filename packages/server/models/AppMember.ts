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

@Table({ tableName: 'AppMember' })
export class AppMember extends Model {
  @PrimaryKey
  @IsUUID(4)
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id: string;

  @AllowNull(false)
  @Column
  role: string;

  @Index({ name: 'UniqueAppMemberEmailIndex', type: 'UNIQUE' })
  @Column
  email: string;

  @Default(false)
  @Column
  emailVerified: boolean;

  @Column
  name: string;

  @Column
  password: string;

  @Column
  emailKey: string;

  @Column
  resetKey: string;

  @Column
  consent: Date;

  @Column
  picture?: Buffer;

  @Column(DataType.JSON)
  properties?: Record<string, string>;

  @Column
  locale?: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Unique('UniqueAppMemberIndex')
  @Index({ name: 'UniqueAppMemberEmailIndex', type: 'UNIQUE' })
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: Awaited<App>;

  @ForeignKey(() => User)
  @Unique('UniqueAppMemberIndex')
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: Awaited<User>;

  @HasMany(() => AppOAuth2Authorization)
  AppOAuth2Authorizations: AppOAuth2Authorization[];

  @HasMany(() => AppSamlAuthorization)
  AppSamlAuthorizations: AppSamlAuthorization[];

  get hasPicture(): boolean {
    return this.get('hasPicture');
  }
}
