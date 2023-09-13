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

  @Column(DataType.STRING)
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
      $created: this.created?.toISOString(),
      $updated: this.updated?.toISOString(),
    };
  }
}
