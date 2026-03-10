import { logger } from '@appsemble/node-utils';
import { SubscriptionPlanType } from '@appsemble/types';
import {
  AfterBulkCreate,
  AfterCreate,
  AllowNull,
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
import { OrganizationSubscription } from './OrganizationSubscription.js';

@Table({ tableName: 'Organization', paranoid: true })
export class Organization extends Model {
  @PrimaryKey
  @Column(DataType.STRING)
  declare id: string;

  @Column(DataType.STRING)
  declare name?: string;

  @Column(DataType.STRING)
  declare description?: string;

  @Column(DataType.STRING)
  declare website?: string;

  @Column(DataType.STRING)
  declare email?: string;

  @Column(DataType.BLOB)
  declare icon?: Buffer;

  @AllowNull(false)
  @Default('en')
  @Column(DataType.STRING)
  declare locale?: string;

  @Column(DataType.STRING)
  declare stripeCustomerId?: string;

  @AllowNull(true)
  @Column(DataType.STRING)
  declare vatIdNumber?: string;

  @Column(DataType.STRING)
  declare invoiceReference?: string;

  @Column(DataType.STRING)
  declare streetName?: string;

  @Column(DataType.STRING)
  declare houseNumber?: string;

  @Column(DataType.STRING(85))
  declare city?: string;

  @Column(DataType.STRING(15))
  declare zipCode?: string;

  @Column(DataType.STRING(2))
  declare countryCode?: string;

  @HasOne(() => OrganizationSubscription)
  declare OrganizationSubscription?: OrganizationSubscription;

  @BelongsToMany(() => User, () => OrganizationMember)
  declare Users: User[];

  @HasMany(() => OrganizationInvite)
  declare OrganizationInvites: OrganizationInvite[];

  @HasMany(() => App)
  declare Apps: App[];

  @HasMany(() => AppCollection)
  declare AppCollections: AppCollection[];

  @HasMany(() => BlockVersion)
  declare BlockVersions: BlockVersion[];

  @CreatedAt
  declare created: Date;

  @UpdatedAt
  declare updated: Date;

  @DeletedAt
  declare deleted?: Date;

  declare OrganizationMember?: Awaited<OrganizationMember>;

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
