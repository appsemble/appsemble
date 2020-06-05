import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import App from './App';

@Table({ tableName: 'AppBlockStyle' })
export default class AppBlockStyle extends Model<AppBlockStyle> {
  @PrimaryKey
  @AllowNull(false)
  @ForeignKey(() => App)
  @Column
  AppId: number;

  /**
   * This refers to the organization and name of a block
   * it is agnostic of the version of the block.
   *
   * Format: @organizationName/blockName
   */
  @PrimaryKey
  @AllowNull(false)
  @Column
  block: string;

  @Column({ type: DataType.TEXT })
  style: string;

  @BelongsTo(() => App)
  App: App;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
