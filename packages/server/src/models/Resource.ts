import {
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import App from './App';
import ResourceSubscription from './ResourceSubscription';
import User from './User';

@Table({ tableName: 'Resource', paranoid: true })
export default class Resource extends Model<Resource> {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @Column
  type: string;

  @Column(DataType.JSON)
  data: any;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;

  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @ForeignKey(() => User)
  @Column(DataType.UUID)
  UserId: string;

  @BelongsTo(() => User)
  User: User;

  @HasMany(() => ResourceSubscription, { onDelete: 'CASCADE' })
  ResourceSubscriptions: ResourceSubscription[];
}
