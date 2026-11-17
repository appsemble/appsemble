import {
  AllowNull,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { OrganizationSso } from './OrganizationSso.js';

@Table({ tableName: 'OrganizationSsoDomain' })
export class OrganizationSsoDomain extends Model {
  @PrimaryKey
  @ForeignKey(() => OrganizationSso)
  @Column(DataType.STRING)
  declare OrganizationId: string;

  @PrimaryKey
  @Index('OrganizationSsoDomain_domain_idx')
  @Column(DataType.STRING)
  declare domain: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare token: string | null;

  @AllowNull(true)
  @Column(DataType.DATE)
  declare verifiedAt: Date | null;

  @AllowNull(false)
  @Column(DataType.STRING)
  declare managedBy: 'studio' | 'deployment';

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @BelongsTo(() => OrganizationSso, { onDelete: 'CASCADE' })
  declare OrganizationSso?: Awaited<OrganizationSso>;
}
