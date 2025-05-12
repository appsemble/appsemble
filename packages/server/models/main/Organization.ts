import { logger } from '@appsemble/node-utils';
import { PaymentProvider, SubscriptionPlanType } from '@appsemble/types';
import {
  AfterBulkCreate,
  AfterCreate,
  BelongsToMany,
  Column,
  CreatedAt,
  DataType,
  Default,
  DeletedAt,
  HasMany,
  HasOne,
  Model,
  PrimaryKey,
  Table,
  UpdatedAt,
} from 'sequelize-typescript';

import {
  App,
  AppCollection,
  BlockVersion,
  OrganizationInvite,
  OrganizationMember,
  User,
} from '../index.js';
import { OrganizationSubscription } from '../OrganizationSubscription.js';

@Table({ tableName: 'Organization', paranoid: true })
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  id!: string;

  @Column(DataType.STRING)
  name?: string;

  @Column(DataType.STRING)
  description?: string;

  @Column(DataType.STRING)
  website?: string;

  @Column(DataType.STRING)
  email?: string;

  @Column(DataType.BLOB)
  icon?: Buffer;

  @Column(DataType.STRING)
  stripeCustomerId?: string;

  @Default(PaymentProvider.Stripe)
  @Column(DataType.ENUM(PaymentProvider.Stripe))
  preferredPaymentProvider?: PaymentProvider;

  @Column(DataType.STRING)
  vatIdNumber?: string;

  @Column(DataType.STRING)
  invoiceReference?: string;

  @Column(DataType.STRING)
  streetName?: string;

  @Column(DataType.STRING)
  houseNumber?: string;

  @Column(DataType.STRING(85))
  city?: string;

  @Column(DataType.STRING(15))
  zipCode?: string;

  @Column(DataType.STRING(2))
  countryCode?: string;

  @HasOne(() => OrganizationSubscription)
  OrganizationSubscription?: OrganizationSubscription;

  @BelongsToMany(() => User, () => OrganizationMember)
  Users!: User[];

  @HasMany(() => OrganizationInvite)
  OrganizationInvites!: OrganizationInvite[];

  @HasMany(() => App)
  Apps!: App[];

  @HasMany(() => AppCollection)
  AppCollections!: AppCollection[];

  @HasMany(() => BlockVersion)
  BlockVersions!: BlockVersion[];

  @CreatedAt
  created!: Date;

  @UpdatedAt
  updated!: Date;

  @DeletedAt
  deleted?: Date;

  OrganizationMember?: Awaited<OrganizationMember>;

  @AfterCreate
  static async afterCreateHook(instance: Organization): Promise<void> {
    const subscription = await OrganizationSubscription.create({
      cancelled: true,
      expirationDate: null,
      subscriptionPlan: SubscriptionPlanType.Free,
      OrganizationId: instance.id,
      renewalPeriod: null,
    });

    logger.info(`Created default subscription with id ${subscription.id}`);
  }

  @AfterBulkCreate
  static async afterBulkCreateHook(instances: Organization[]): Promise<void> {
    const subscriptions = await OrganizationSubscription.bulkCreate(
      instances.map((instance) => ({
        cancelled: true,
        expirationDate: null,
        subscriptionPlan: SubscriptionPlanType.Free,
        OrganizationId: instance.id,
        renewalPeriod: null,
      })),
    );

    logger.info(`created ${subscriptions.length} default subscriptions`);
  }
}
