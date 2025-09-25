import {
  getSubscriptionPlanByName,
  type SubscriptionPlan,
  SubscriptionPlanType,
  SubscriptionRenewalPeriod,
} from '@appsemble/types';
import dayjs from 'dayjs';
import { Decimal } from 'decimal.js';
import salesTax from 'sales-tax';

import { Coupon } from '../models/Coupon.js';
import { type OrganizationSubscription } from '../models/OrganizationSubscription.js';

export interface PricingInfo {
  /**
   * The total price of the subscription including VAT and discounts.
   */
  totalPrice: string;

  /**
   * The base price of the subscription excluding VAT.
   */
  basePrice: string;

  /**
   * The discount applied based on currently active subscription.
   */
  activeSubscriptionDiscount: string;

  /**
   * The VAT percentage for the provided country.
   */
  vatPercentage: string;

  /**
   * The VAT amount for provided base price.
   */
  vatAmount: string;

  /**
   * The Discount given based on a coupon code.
   */
  couponDiscount: string;

  /**
   * Base price of the subscription after coupon is applied.
   */
  priceWithCoupon: string;
}

export async function calculateSubscriptionPrice(
  subscriptionPlan: SubscriptionPlan,
  currentSubscription: OrganizationSubscription,
  period: string,
  countryCode: string,
  vatIdNumber?: string,
  couponCode?: string,
  activationDate?: Date,
): Promise<PricingInfo | undefined> {
  const startDate = dayjs(activationDate) || dayjs();
  let basePrice = new Decimal(subscriptionPlan.price);
  let couponDiscount = new Decimal(0);
  let discountedPrice = new Decimal(subscriptionPlan.price);
  let activeSubscriptionDiscount = new Decimal(0);

  if (period === SubscriptionRenewalPeriod.Year) {
    const monthsInAYear = 12;
    basePrice = basePrice.times(monthsInAYear);
  }

  if (currentSubscription.subscriptionPlan !== SubscriptionPlanType.Free) {
    const expirationDate = dayjs(currentSubscription.expirationDate);
    const dayDifference = expirationDate.add(1, 'day').diff(activationDate, 'day');
    if (dayDifference > 0) {
      const currentSubscriptionPlan = getSubscriptionPlanByName(
        currentSubscription.subscriptionPlan!,
      );
      activeSubscriptionDiscount = new Decimal(currentSubscriptionPlan.price)
        .dividedBy(startDate.daysInMonth())
        .mul(dayDifference);
      if (activeSubscriptionDiscount.greaterThan(basePrice)) {
        activeSubscriptionDiscount = basePrice;
      }
      discountedPrice = basePrice.minus(activeSubscriptionDiscount);
    }
  }

  if (vatIdNumber) {
    const valid = await salesTax.validateTaxNumber(countryCode, vatIdNumber);
    if (!valid) {
      return;
    }
  }

  if (couponCode) {
    const coupon = await Coupon.findByPk(couponCode);
    if (coupon) {
      couponDiscount = basePrice.times(new Decimal(coupon.discount).dividedBy(100));
    }
  }
  salesTax.setTaxOriginCountry('NL', true);
  const pricingInfo = await salesTax.getAmountWithSalesTax(
    countryCode,
    vatIdNumber,
    discountedPrice.greaterThan(couponDiscount)
      ? discountedPrice.minus(couponDiscount).toNumber()
      : 0,
  );

  return {
    totalPrice: pricingInfo.total.toFixed(2),
    basePrice: basePrice.greaterThan(0) ? basePrice.toDecimalPlaces(2).toFixed(2) : '0.00',
    vatPercentage: pricingInfo.rate.toFixed(2),
    activeSubscriptionDiscount: activeSubscriptionDiscount.toDecimalPlaces(2).toFixed(2),
    vatAmount: new Decimal(pricingInfo.total)
      .minus(pricingInfo.price)
      .toDecimalPlaces(2)
      .toFixed(2),
    couponDiscount: couponDiscount.toDecimalPlaces(2).toFixed(2),
    priceWithCoupon: discountedPrice.greaterThan(couponDiscount)
      ? discountedPrice.minus(couponDiscount).toDecimalPlaces(2).toFixed(2)
      : '0.00',
  };
}
