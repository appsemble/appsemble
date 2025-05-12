import { SubscriptionPlanType, SubscriptionRenewalPeriod } from '@appsemble/types';
import {
  AllowNull,
  AutoIncrement,
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  Index,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import { Organization } from './Organization.js';

@Table({ tableName: 'OrganizationSubscription' })
export class OrganizationSubscription extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id?: number;

  @AllowNull(false)
  @Column(DataType.BOOLEAN)
  cancelled?: Boolean;

  @Column(DataType.TEXT)
  cancellationReason?: string;

  @Column(DataType.DATE)
  cancelledAt?: Date;

  @Column(DataType.DATEONLY)
  expirationDate?: Date;

  @AllowNull(false)
  @Default(SubscriptionPlanType.Free)
  @Column(DataType.ENUM(...Object.values(SubscriptionPlanType)))
  subscriptionPlan?: SubscriptionPlanType;

  @Column(DataType.ENUM(...Object.values(SubscriptionRenewalPeriod)))
  renewalPeriod?: SubscriptionRenewalPeriod;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Index({ name: 'OrganizationSubscription_path_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  OrganizationId?: string;

  @BelongsTo(() => Organization)
  Organization?: Awaited<Organization>;

  @CreatedAt
  created?: Date;

  @UpdatedAt
  updated?: Date;
}
