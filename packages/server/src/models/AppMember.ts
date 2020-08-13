import {
  AllowNull,
  Column,
  CreatedAt,
  ForeignKey,
  Model,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, User } from '.';

@Table({ tableName: 'AppMember' })
export class AppMember extends Model<AppMember> {
  @AllowNull(false)
  @Column
  role: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @ForeignKey(() => App)
  @Column
  AppId: number;

  @ForeignKey(() => User)
  @Column
  UserId: number;
}
