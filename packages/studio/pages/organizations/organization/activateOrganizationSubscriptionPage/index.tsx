import { Button, useMeta } from '@appsemble/react-components';
import {
  getSubscriptionPlanByName,
  type OrganizationSubscription,
  SubscriptionRenewalPeriod,
} from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import { BillingInformationBox } from './billingInformationBox.js';
import { messages } from './messages.js';
import { SubscriptionInformationBox } from './subscriptionInformationBox.js';
import { type Organization } from '../../../../types.js';

interface ActivateOrganizationSubscriptionPageProps {
  /**
   * The organization we want to associate with the subscription.
   */
  readonly organization: Organization;

  /**
   * The subscription plan that user currently has.
   */
  readonly currentSubscription: OrganizationSubscription;

  /**
   * Change handler used to update the organization for the parent component.
   */
  readonly onChangeOrganization: (organization: Organization) => void;
}

enum Step {
  SubscriptionInformation = 'subscriptionInformation',
  BillingInformation = 'billingInformation',
  FinalSubscriptionInformation = 'finalSubscriptionInformation',
}

/**
 * The page for activating a subscription.
 */
export function ActivateOrganizationSubscriptionPage({
  currentSubscription,
  onChangeOrganization,
  organization,
}: ActivateOrganizationSubscriptionPageProps): ReactNode {
  const [currentStep, setCurrentStep] = useState<Step>(Step.SubscriptionInformation);
  const { subscriptionPlanName } = useParams<{ subscriptionPlanName: string }>();
  const subscriptionPlan = getSubscriptionPlanByName(subscriptionPlanName);
  const { formatMessage } = useIntl();
  const [renewalPeriod, setRenewalPeriod] = useState<SubscriptionRenewalPeriod>(
    currentSubscription?.renewalPeriod || SubscriptionRenewalPeriod.Month,
  );
  const [couponCode, setCouponCode] = useState<string>('');

  const nextStep = useCallback(() => {
    const steps = [
      Step.SubscriptionInformation,
      Step.BillingInformation,
      Step.FinalSubscriptionInformation,
    ];

    const currentIndex = steps.indexOf(currentStep);
    const nextIndex = currentIndex + 1;
    setCurrentStep(steps[nextIndex]);
  }, [currentStep]);

  const getStepIndex = (): number => Object.values(Step).indexOf(currentStep);

  const sendInvoice = async (): Promise<void> => {
    const response = await axios.post(
      `/api/payments/send-invoice?organizationId=${organization.id}&subscriptionType=${subscriptionPlanName}&period=${renewalPeriod}&couponCode=${couponCode}`,
    );
    window.location.href = response.data.url;
    nextStep();
  };

  function renderStep(): ReactNode {
    switch (currentStep) {
      case Step.SubscriptionInformation:
        return (
          <SubscriptionInformationBox
            checkout={nextStep}
            couponCode={couponCode}
            currentSubscription={currentSubscription}
            organization={organization}
            renewalPeriod={renewalPeriod}
            setCouponCode={setCouponCode}
            setRenewalPeriod={setRenewalPeriod}
            subscriptionPlan={subscriptionPlan}
          />
        );
      case Step.BillingInformation:
        return (
          <BillingInformationBox
            nextStep={nextStep}
            onChangeOrganization={onChangeOrganization}
            organization={organization}
            subscriptionPlan={subscriptionPlan}
          />
        );
      case Step.FinalSubscriptionInformation:
        return (
          <SubscriptionInformationBox
            checkout={sendInvoice}
            couponCode={couponCode}
            currentSubscription={currentSubscription}
            includeVat
            organization={organization}
            renewalPeriod={renewalPeriod}
            setCouponCode={setCouponCode}
            setRenewalPeriod={setRenewalPeriod}
            subscriptionPlan={subscriptionPlan}
          />
        );
      default:
        return (
          <SubscriptionInformationBox
            checkout={nextStep}
            couponCode={couponCode}
            currentSubscription={currentSubscription}
            organization={organization}
            renewalPeriod={renewalPeriod}
            setCouponCode={setCouponCode}
            setRenewalPeriod={setRenewalPeriod}
            subscriptionPlan={subscriptionPlan}
          />
        );
    }
  }

  useMeta(formatMessage(messages.activate));

  return (
    <>
      <div className="title is-3">
        <FormattedMessage {...messages.title} />
      </div>
      <FormattedMessage {...messages.help} />
      <div className="buttons">
        <Button
          className="is-white"
          icon={getStepIndex() > 0 ? 'circle-check' : '1'}
          iconColor={getStepIndex() > 0 ? 'success' : null}
          onClick={() => setCurrentStep(Step.SubscriptionInformation)}
        >
          <FormattedMessage {...messages.subscription} />
        </Button>
        <Button
          className="is-white"
          disabled={getStepIndex() < 1}
          icon={getStepIndex() > 1 ? 'circle-check' : '2'}
          iconColor={getStepIndex() > 1 ? 'success' : null}
          onClick={() => setCurrentStep(Step.BillingInformation)}
        >
          <FormattedMessage {...messages.billing} />
        </Button>
        <Button
          className="is-white"
          disabled={getStepIndex() < 2}
          icon={getStepIndex() > 2 ? 'circle-check' : '3'}
          iconColor={getStepIndex() > 2 ? 'success' : null}
          onClick={() => setCurrentStep(Step.FinalSubscriptionInformation)}
        >
          <FormattedMessage {...messages.reviewDetails} />
        </Button>
      </div>
      {renderStep()}
    </>
  );
}
