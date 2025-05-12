import {
  Button,
  FormButtons,
  RadioButton,
  RadioGroup,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import {
  type Organization,
  type OrganizationSubscription,
  type SubscriptionPlan,
  SubscriptionRenewalPeriod,
} from '@appsemble/types';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface SubscriptionInformationBoxProps {
  /**
   * The subscription plan that user is trying to buy.
   */
  readonly subscriptionPlan: SubscriptionPlan;

  /**
   * The subscription plan that user currently has.
   */
  readonly currentSubscription: OrganizationSubscription;

  /**
   * The subscription plan that user currently has.
   */
  readonly organization: Organization;

  /**
   * Whether we should include VAT in the displayed price.
   */
  readonly includeVat?: boolean;

  /**
   * Preferred renewal period for the user.
   */
  readonly renewalPeriod: SubscriptionRenewalPeriod;

  /**
   * The function to update the renewal period.
   */
  readonly setRenewalPeriod: (renewalPeriod: SubscriptionRenewalPeriod) => void;

  /**
   * Active coupon code.
   */
  readonly couponCode: string;

  /**
   * The function to update the coupon code.
   */
  readonly setCouponCode: (couponCode: string) => void;

  /**
   * The function to advance to next step.
   */
  readonly checkout: () => void;
}

interface PricingInfo {
  basePrice: string;
  totalPrice?: string;
  vatAmount?: string;
  couponDiscount?: string;
  vatPercentage?: string;
  priceWithCoupon?: string;
}

export function SubscriptionInformationBox({
  checkout,
  couponCode,
  currentSubscription,
  includeVat,
  organization,
  renewalPeriod,
  setCouponCode,
  setRenewalPeriod,
  subscriptionPlan,
}: SubscriptionInformationBoxProps): ReactNode {
  const [subscriptionPrice, setSubscriptionPrice] = useState<PricingInfo>({
    basePrice: subscriptionPlan.price,
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const defaultValues = useMemo(
    () => ({
      coupon: couponCode,
    }),
    [couponCode],
  );

  const onCouponSubmit = ({ coupon }: typeof defaultValues): void => {
    setCouponCode(coupon);
  };

  useEffect(() => {
    async function fetchPrice(): Promise<void> {
      const price = await axios.get(
        `/api/organizations/${organization.id}/subscription/price?subscriptionType=${subscriptionPlan.name}&period=${renewalPeriod}&couponCode=${couponCode}`,
      );
      setSubscriptionPrice(price?.data);
    }
    fetchPrice();
  }, [organization.id, renewalPeriod, subscriptionPlan.name, couponCode]);

  const changePeriod = useCallback(
    (event: ChangeEvent, value: SubscriptionRenewalPeriod) => {
      setRenewalPeriod(value);
    },
    [setRenewalPeriod],
  );

  const submit = (): void => {
    setIsLoading(true);
    checkout();
  };

  return (
    <>
      <div className="box is-flex is-justify-content-space-between">
        <FormattedMessage {...messages.chosenSubscription} />
        {subscriptionPlan.name}
        <span className="has-text-right">
          €{' '}
          {subscriptionPrice?.basePrice?.includes('.')
            ? subscriptionPrice.basePrice
            : `${subscriptionPrice.basePrice}.-`}
          p/m
        </span>
      </div>
      {currentSubscription?.subscriptionPlan === 'free' ? null : (
        <div className="box is-flex is-justify-content-space-between">
          <FormattedMessage {...messages.activeSubscriptionHelp} />
        </div>
      )}
      {includeVat ? (
        <div className="box is-flex is-flex-direction-column has-background-light is-align-items-flex-end">
          <div className="is-flex is-flex-direction-row">
            <div className="is-flex is-flex-direction-column is-align-items-flex-start">
              <div className="pr-5">
                <FormattedMessage {...messages.subscriptionPrice} />
              </div>
              <div className="pr-5">
                <FormattedMessage {...messages.couponDiscount} />
              </div>
              <div className="pr-5">
                <FormattedMessage {...messages.vatAmount} />{' '}
                {Number.parseFloat(subscriptionPrice.vatPercentage) * 100}%
              </div>
              <div className="pr-5 has-text-weight-bold mt-2">
                <FormattedMessage {...messages.totalPrice} />
              </div>
            </div>
            <div className="is-flex is-flex-direction-column is-align-items-flex-start">
              <span className="is-flex is-align-items-flex-end">€</span>
              <span className="is-flex is-align-items-flex-end">€</span>
              <span className="is-flex is-.couponDiscountalign-items-flex-end">€</span>
              <span className="is-flex is-align-items-flex-end has-text-weight-bold mt-2">€</span>
            </div>
            <div className="is-flex is-flex-direction-column is-align-items-flex-end">
              <span className="is-flex is-align-items-flex-end">
                {subscriptionPrice.basePrice}.-
              </span>
              <span className="is-flex is-align-items-flex-end">
                - {subscriptionPrice?.couponDiscount?.replace(/\.00$/, '.-')}
              </span>
              <span className="is-flex is-.couponDiscountalign-items-flex-end">
                {Number.parseFloat(subscriptionPrice?.vatAmount) % 10 === 0
                  ? `${subscriptionPrice?.vatAmount}.-`
                  : subscriptionPrice?.vatAmount}
              </span>
              <span className="is-flex is-align-items-flex-end has-text-weight-bold mt-2">
                {subscriptionPrice?.totalPrice?.includes('.')
                  ? subscriptionPrice?.totalPrice
                  : `${subscriptionPrice?.totalPrice}.-`}
              </span>
            </div>
          </div>
          <div className="mt-5">
            <Button
              color="primary"
              disabled={isLoading}
              icon="chevron-right"
              iconPosition="right"
              onClick={submit}
            >
              <FormattedMessage {...messages.summary} />
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div className="box">
            <FormattedMessage {...messages.selectType} />
            <RadioGroup name="type" onChange={changePeriod} value={renewalPeriod}>
              <RadioButton id="year" value={SubscriptionRenewalPeriod.Year}>
                <FormattedMessage {...messages.year} />
              </RadioButton>
              <RadioButton id="month" value={SubscriptionRenewalPeriod.Month}>
                <FormattedMessage {...messages.month} />
              </RadioButton>
            </RadioGroup>
          </div>
          <div className="box is-flex has-background-light is-justify-content-space-between">
            <SimpleForm defaultValues={defaultValues} onSubmit={onCouponSubmit}>
              <SimpleFormField label={<FormattedMessage {...messages.coupon} />} name="coupon" />
              {Number.parseFloat(subscriptionPrice?.couponDiscount) === 0 && couponCode ? (
                <div className="has-text-danger pb-4">
                  <FormattedMessage {...messages.couponCodeInvalid} />{' '}
                </div>
              ) : null}
              <FormButtons>
                <SimpleSubmit>
                  <FormattedMessage {...messages.submit} />
                </SimpleSubmit>
              </FormButtons>
            </SimpleForm>
            <div className="is-flex is-flex-direction-column is-align-items-flex-end">
              <div className="is-flex is-flex-direction-row">
                <div className="is-flex is-flex-direction-column is-align-items-flex-start">
                  <div className="pr-5">
                    <FormattedMessage {...messages.subscriptionPrice} />
                  </div>
                  <div className="pr-5">
                    <FormattedMessage {...messages.couponDiscount} />
                  </div>
                  <div className="pr-5 has-text-weight-bold mt-2">
                    <FormattedMessage {...messages.totalPrice} />
                  </div>
                </div>
                <div className="is-flex is-flex-direction-column is-align-items-flex-start">
                  <span className="is-flex is-align-items-flex-end">€</span>
                  <span className="is-flex is-align-items-flex-end">€</span>
                  <span className="is-flex is-align-items-flex-end has-text-weight-bold mt-2">
                    €
                  </span>
                </div>
                <div className="is-flex is-flex-direction-column is-align-items-flex-end  ">
                  <span className="is-flex is-align-items-flex-end">
                    {subscriptionPrice?.basePrice?.includes('.')
                      ? subscriptionPrice.basePrice
                      : `${subscriptionPrice.basePrice}.-`}
                  </span>
                  <span className="is-flex is-align-items-flex-end">
                    -{' '}
                    {subscriptionPrice.couponDiscount
                      ? subscriptionPrice.couponDiscount.replace(/\.00$/, '.-')
                      : 0}
                  </span>
                  <span className="is-flex is-align-items-flex-end has-text-weight-bold mt-2">
                    {subscriptionPrice?.priceWithCoupon?.includes('.')
                      ? subscriptionPrice?.priceWithCoupon
                      : `${subscriptionPrice?.priceWithCoupon}.-`}
                  </span>
                </div>
              </div>
              <div className="mt-5">
                <Button
                  color="primary"
                  disabled={isLoading}
                  icon="chevron-right"
                  iconPosition="right"
                  onClick={checkout}
                >
                  <FormattedMessage {...messages.checkout} />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
