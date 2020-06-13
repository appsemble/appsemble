import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
} from 'sequelize-typescript';

import App from './App';
import User from './User';

@Table({ tableName: 'OAuth2AuthorizationCode', createdAt: false, updatedAt: false })
export default class OAuth2AuthorizationCode extends Model<OAuth2AuthorizationCode> {
  @PrimaryKey
  @AllowNull(false)
  @Column
  code: string;

  @AllowNull(false)
  @Column
  redirectUri: string;

  @AllowNull(false)
  @Column
  expires: Date;

  @AllowNull(false)
  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User, { onDelete: 'CASCADE' })
  User: User;

  @AllowNull(false)
  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App, { onDelete: 'CASCADE' })
  App: App;
}
