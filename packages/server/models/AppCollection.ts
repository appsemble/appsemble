import {
  type AppCollection as AppCollectionType,
  type AppCollectionVisibility,
} from '@appsemble/types';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppCollectionApp, Organization } from './index.js';

@Table({ tableName: 'AppCollection' })
export class AppCollection extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  headerImage: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  headerImageMimeType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  expertName: string;

  @Column(DataType.STRING(4000))
  expertDescription?: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  expertProfileImage: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  expertProfileImageMimeType: string;

  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column(DataType.STRING)
  OrganizationId: string;

  @BelongsTo(() => Organization)
  Organization: Awaited<Organization>;

  @AllowNull(false)
  @Column(DataType.STRING)
  visibility: AppCollectionVisibility;

  @HasMany(() => AppCollectionApp)
  Apps: AppCollectionApp[];

  /**
   * The maximum length of a domain name is 255 bytes as per
   * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
   * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
   */
  @Column({ type: DataType.STRING(253) })
  domain?: string;

  @CreatedAt
  created: Date;

  @UpdatedAt
  updated: Date;

  toJSON(): AppCollectionType {
    return {
      id: this.id,
      name: this.name,
      OrganizationId: this.OrganizationId,
      OrganizationName: this.Organization?.name,
      visibility: this.visibility,
      $expert: {
        name: this.expertName,
        description: this.expertDescription,
        profileImage: `/api/appCollections/${this.id}/expert/profileImage`,
      },
      headerImage: `/api/appCollections/${this.id}/headerImage`,
      domain: this.domain,
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
    };
  }
}
