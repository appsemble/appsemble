import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DeletedAt,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App, Organization } from '.';

@Table({ tableName: 'OrganizationBlockStyle', paranoid: true })
export default class OrganizationBlockStyle extends Model<OrganizationBlockStyle> {
  @PrimaryKey
  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column
  OrganizationId: string;

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

  @Column(DataType.TEXT)
  style: string;

  @ForeignKey(() => App)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  @DeletedAt
  deleted: Date;
}
