import {
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

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @BelongsTo(() => OrganizationSso, { onDelete: 'CASCADE' })
  declare OrganizationSso?: Awaited<OrganizationSso>;
}
