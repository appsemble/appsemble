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
  declare id?: number;

  @AllowNull(false)
  @Default(false)
  @Column(DataType.BOOLEAN)
  declare cancelled?: Boolean;

  @Column(DataType.TEXT)
  declare cancellationReason?: string;

  @Column(DataType.DATE)
  declare cancelledAt?: Date;

  @Column(DataType.DATEONLY)
  declare expirationDate?: Date;

  @AllowNull(false)
  @Default(SubscriptionPlanType.Free)
  @Column(DataType.ENUM(...Object.values(SubscriptionPlanType)))
  declare subscriptionPlan?: SubscriptionPlanType;

  @Column(DataType.ENUM(...Object.values(SubscriptionRenewalPeriod)))
  declare renewalPeriod?: SubscriptionRenewalPeriod;

  @AllowNull(false)
  @ForeignKey(() => Organization)
  @Index({ name: 'OrganizationSubscription_path_OrganizationId_key', unique: true })
  @Column(DataType.STRING)
  declare OrganizationId?: string;

  @BelongsTo(() => Organization, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  declare Organization?: Awaited<Organization>;

  @CreatedAt
  declare created?: Date;

  @UpdatedAt
  declare updated?: Date;
}
