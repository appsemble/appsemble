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
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { AppCollectionApp, Organization } from '../index.js';

@Table({ tableName: 'AppCollection' })
export class AppCollection extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare name: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare headerImage: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare headerImageMimeType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare expertName: string;

  @Column(DataType.STRING(4000))
  declare expertDescription?: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  declare expertProfileImage: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare expertProfileImageMimeType: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare visibility: AppCollectionVisibility;

  /**
   * The maximum length of a domain name is 255 bytes as per
   * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
   * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
   */
  @Column({ type: DataType.STRING(253) })
  @Index({ name: 'appCollectionComposite' })
  declare domain?: string;

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  @Index({ name: 'appCollectionComposite', order: 'DESC' })
  declare updated: Date;

  @HasMany(() => AppCollectionApp)
  declare Apps: AppCollectionApp[];

  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @BelongsTo(() => Organization, { onDelete: 'CASCADE' })
  declare Organization?: Awaited<Organization>;

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
        profileImage: `/api/app-collections/${this.id}/expert/profile-image`,
      },
      headerImage: `/api/app-collections/${this.id}/header-image`,
      domain: this.domain,
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
    };
  }
}
