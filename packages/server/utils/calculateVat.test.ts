import { getSubscriptionPlanByName, SubscriptionPlanType } from '@appsemble/types';
import dayjs from 'dayjs';
import { beforeEach, describe, expect, it } from 'vitest';

import { calculateSubscriptionPrice } from './calculateVat.js';
import { Coupon, OrganizationSubscription } from '../models/index.js';
import { Organization } from '../models/Organization.js';

let organization: Organization;
let subscription: OrganizationSubscription;
let coupon: Coupon;

describe('calculateVat', () => {
  beforeEach(async () => {
    organization = await Organization.create({
      id: 'testorganization',
      name: 'Test Organization',
    });
    subscription = (await OrganizationSubscription.findOne({
      where: { OrganizationId: organization.id },
    }))!;
    coupon = await Coupon.create({ code: 'testCoupon', discount: 20 });
  });

  it('should fetch the price of a subscription.', async () => {
    const result = await calculateSubscriptionPrice(
      getSubscriptionPlanByName('basic'),
      subscription,
      'month',
      'NL',
      organization.vatIdNumber,
    );

    expect(result).toMatchObject({
      totalPrice: '6.05',
      basePrice: '5.00',
      vatPercentage: '0.21',
      vatAmount: '1.05',
    });
  });

  it('should not fetch the price of a subscription if the vat Id is invalid.', async () => {
    const result = await calculateSubscriptionPrice(
      getSubscriptionPlanByName('basic'),
      subscription,
      'month',
      'NL',
      'a',
    );

    expect(result).toBeUndefined();
  });

  it('should fetch the price of a subscription discounted based on currently active subscription.', async () => {
    subscription.subscriptionPlan = SubscriptionPlanType.Basic;
    const date = dayjs();
    subscription.expirationDate = new Date(String(date.add(20, 'day')));
    subscription.save();
    const result = await calculateSubscriptionPrice(
      getSubscriptionPlanByName('basic'),
      subscription,
      'month',
      'NL',
      organization.vatIdNumber,
    );

    expect(Number.parseFloat(result!.activeSubscriptionDiscount)).toBeGreaterThan(0);
    expect(Number.parseFloat(result!.totalPrice)).toBeLessThan(5);
  });

  it('should fetch the price of a subscription and apply a coupon.', async () => {
    const result = await calculateSubscriptionPrice(
      getSubscriptionPlanByName('basic'),
      subscription,
      'month',
      'NL',
      organization.vatIdNumber,
      coupon.code,
    );

    expect(result).toMatchObject({
      totalPrice: '4.84',
      basePrice: '5.00',
      couponDiscount: '1.00',
      vatPercentage: '0.21',
      vatAmount: '0.84',
    });
  });

  it('should fetch the price of a subscription but not apply an invalid coupon.', async () => {
    const result = await calculateSubscriptionPrice(
      getSubscriptionPlanByName('basic'),
      subscription,
      'month',
      'NL',
      organization.vatIdNumber,
      'fakeCoupon',
    );

    expect(result).toMatchObject({
      totalPrice: '6.05',
      basePrice: '5.00',
      couponDiscount: '0.00',
      vatPercentage: '0.21',
      vatAmount: '1.05',
    });
  });
});
