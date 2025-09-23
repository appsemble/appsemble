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
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  headerImage!: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  headerImageMimeType!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  expertName!: string;

  @Column(DataType.STRING(4000))
  expertDescription?: string;

  @AllowNull(false)
  @Column(DataType.BLOB)
  expertProfileImage!: Buffer;

  @AllowNull(false)
  @Column(DataType.STRING)
  expertProfileImageMimeType!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  visibility!: AppCollectionVisibility;

  /**
   * The maximum length of a domain name is 255 bytes as per
   * https://tools.ietf.org/html/rfc1034#section-3.1. The reason the maximum length of the field
   * is 253, is explained on https://devblogs.microsoft.com/oldnewthing/20120412-00/?p=7873.
   */
  @Column({ type: DataType.STRING(253) })
  @Index({ name: 'appCollectionComposite' })
  domain?: string;

  @CreatedAt
  created!: Date;

  @UpdatedAt
  @Index({ name: 'appCollectionComposite', order: 'DESC' })
  updated!: Date;

  @HasMany(() => AppCollectionApp)
  Apps!: AppCollectionApp[];

  @ForeignKey(() => Organization)
  @AllowNull(false)
  @Column(DataType.STRING)
  OrganizationId!: string;

  @BelongsTo(() => Organization, { onDelete: 'CASCADE' })
  Organization?: Awaited<Organization>;

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
