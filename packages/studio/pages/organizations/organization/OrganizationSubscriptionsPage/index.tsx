import { useMeta, useToggle } from '@appsemble/react-components';
import {
  basicPlan,
  enterprisePlan,
  extensivePlan,
  freePlan,
  type OrganizationSubscription,
  standardPlan,
} from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { type Organization } from '../../../../types.js';
import { CancelOrganizationSubscriptionModal } from '../cancelOrganizationSubscriptionModal.ts/index.js';
import { ExtendOrganizationSubscriptionModal } from '../extendOrganizationSubscriptionModal/index.js';
import { OrganizationSubscriptionCard } from '../OrganizationSubscriptionCard/index.js';

interface OrganizationSubscriptionsPageProps {
  /**
   * The organization the settings belong to.
   */
  readonly organization: Organization;

  /**
   * Whether the user is allowed to edit subscriptions.
   */
  readonly editSubscriptions: boolean;
}

/**
 * The page for configuring various settings of an organization.
 */
export function OrganizationSubscriptionsPage({
  editSubscriptions,
  organization,
}: OrganizationSubscriptionsPageProps): ReactNode {
  const { formatMessage } = useIntl();
  const cancelSubscriptionModal = useToggle();
  const extendSubscriptionModal = useToggle();
  const [fetchedSubscription, setFetchedSubscription] = useState<OrganizationSubscription>();
  const fetchSubscription = useCallback(async () => {
    const subscription = await axios.get(`/api/organizations/${organization.id}/subscription`);
    setFetchedSubscription(subscription.data);
  }, [organization.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription, cancelSubscriptionModal, extendSubscriptionModal]);

  useMeta(formatMessage(messages.subscriptions));

  return (
    <>
      <div className={`${styles.root} is-flex is-align-items-stretch is-multiline`}>
        <OrganizationSubscriptionCard
          active={fetchedSubscription?.subscriptionPlan === 'free'}
          cancelled={fetchedSubscription?.cancelled}
          expirationDate={fetchedSubscription?.expirationDate}
          mayEditSubscriptions={editSubscriptions}
          subscriptionPlan={freePlan}
          toggleCancel={cancelSubscriptionModal.toggle}
          toggleExtend={extendSubscriptionModal.toggle}
        />
        <OrganizationSubscriptionCard
          active={fetchedSubscription?.subscriptionPlan === 'basic'}
          cancelled={fetchedSubscription?.cancelled}
          expirationDate={fetchedSubscription?.expirationDate}
          mayEditSubscriptions={editSubscriptions}
          subscriptionPlan={basicPlan}
          toggleCancel={cancelSubscriptionModal.toggle}
          toggleExtend={extendSubscriptionModal.toggle}
        />
        <OrganizationSubscriptionCard
          active={fetchedSubscription?.subscriptionPlan === 'standard'}
          cancelled={fetchedSubscription?.cancelled}
          expirationDate={fetchedSubscription?.expirationDate}
          mayEditSubscriptions={editSubscriptions}
          subscriptionPlan={standardPlan}
          toggleCancel={cancelSubscriptionModal.toggle}
          toggleExtend={extendSubscriptionModal.toggle}
        />
        <OrganizationSubscriptionCard
          active={fetchedSubscription?.subscriptionPlan === 'extensive'}
          cancelled={fetchedSubscription?.cancelled}
          expirationDate={fetchedSubscription?.expirationDate}
          mayEditSubscriptions={editSubscriptions}
          subscriptionPlan={extensivePlan}
          toggleCancel={cancelSubscriptionModal.toggle}
          toggleExtend={extendSubscriptionModal.toggle}
        />
        <OrganizationSubscriptionCard
          active={fetchedSubscription?.subscriptionPlan === 'enterprise'}
          cancelled={fetchedSubscription?.cancelled}
          expirationDate={fetchedSubscription?.expirationDate}
          mayEditSubscriptions={editSubscriptions}
          subscriptionPlan={enterprisePlan}
          toggleCancel={cancelSubscriptionModal.toggle}
          toggleExtend={extendSubscriptionModal.toggle}
        />
      </div>
      <CancelOrganizationSubscriptionModal
        state={cancelSubscriptionModal}
        subscription={fetchedSubscription}
      />
      <ExtendOrganizationSubscriptionModal
        state={extendSubscriptionModal}
        subscription={fetchedSubscription}
      />
    </>
  );
}
