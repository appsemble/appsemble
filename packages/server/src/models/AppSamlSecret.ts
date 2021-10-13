// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { IconName } from '@fortawesome/fontawesome-common-types';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  DefaultScope,
  ForeignKey,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { App } from '.';

@DefaultScope(() => ({
  attributes: [
    'id',
    'idpCertificate',
    'entityId',
    'ssoUrl',
    'name',
    'icon',
    'spCertificate',
    'emailAttribute',
    'nameAttribute',
  ],
}))
@Table({ tableName: 'AppSamlSecret' })
export class AppSamlSecret extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column
  id: number;

  @AllowNull(false)
  @Column(DataType.TEXT)
  idpCertificate: string;

  @AllowNull(false)
  @Column
  entityId: string;

  @AllowNull(false)
  @Column
  ssoUrl: string;

  @AllowNull(false)
  @Column
  name: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  icon: IconName;

  @AllowNull(false)
  @Column(DataType.TEXT)
  spPrivateKey: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  spPublicKey: string;

  @AllowNull(false)
  @Column(DataType.TEXT)
  spCertificate: string;

  @Column
  emailAttribute: string;

  @Column
  nameAttribute: string;

  /**
   * The id of the app this secret is linked to.
   */
  @ForeignKey(() => App)
  @AllowNull(false)
  @Column
  AppId: number;

  @BelongsTo(() => App)
  App: App;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;
}
