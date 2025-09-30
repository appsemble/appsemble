import { Button } from '@appsemble/react-components';
import { type SubscriptionPlan } from '@appsemble/types';
import { type ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { SubscriptionPlanItem } from './subscriptionPlanItem.js';

interface OrganizationSubscriptionCardProps {
  /**
   * Subscription plan that will be rendered.
   */
  readonly subscriptionPlan: SubscriptionPlan;

  /**
   * Whether the subscription plan is currently active.
   */
  readonly active: boolean;

  /**
   * Whether the subscription plan will be renewed.
   */
  readonly cancelled: boolean;

  /**
   * Whether the user is allowed to edit subscriptions.
   */
  readonly mayEditSubscriptions: boolean;

  /**
   * If this subscription is currently active, but cancelled we want to show an expiration date.
   */
  readonly expirationDate?: string;

  /**
   * Used to toggle cancelOrganizationSubscriptionModal
   */
  readonly toggleCancel: () => void;

  /**
   * Used to toggle extendOrganizationSubscriptionModal
   */
  readonly toggleExtend: () => void;
}

/**
 * A single card for displaying an organization subscription.
 */
export function OrganizationSubscriptionCard({
  active,
  cancelled,
  expirationDate,
  mayEditSubscriptions,
  subscriptionPlan,
  toggleCancel,
}: OrganizationSubscriptionCardProps): ReactNode {
  const { formatMessage } = useIntl();
  return (
    <article className="card is-flex is-flex-direction-column is-align-self-auto column is-one-quarter">
      <div className="card-content has-text-centered">
        <p className="title is-4">
          {subscriptionPlan.name.toUpperCase()}
          {active ? (
            <span className="is-pulled-right">
              <i className="fa-solid fa-circle has-text-success" />
              <FormattedMessage {...messages.active} />
            </span>
          ) : null}
        </p>
        <p className="subtitle is-6">
          €{subscriptionPlan.price},-p/m
          {expirationDate && active && cancelled ? (
            <span className="is-pulled-right">
              <FormattedMessage {...messages.expirationDate} />
              {new Date(expirationDate)
                .toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                })
                .replaceAll('/', '-')}{' '}
            </span>
          ) : null}
        </p>
      </div>
      <div className="card-content">
        <ul>
          {subscriptionPlan.dailyNotifications === Number.POSITIVE_INFINITY ? (
            <SubscriptionPlanItem text={formatMessage(messages.unlimitedNotifications)} />
          ) : (
            <SubscriptionPlanItem
              text={`${formatMessage(messages.limitedNotifications)}  ${subscriptionPlan.dailyNotifications}`}
            />
          )}
          <SubscriptionPlanItem text={subscriptionPlan.blocks} />
          <SubscriptionPlanItem
            text={`${formatMessage(messages.storage)} ${subscriptionPlan.persistentStorage} GB`}
          />
          <SubscriptionPlanItem text={`${formatMessage(messages.sla)} ${subscriptionPlan.sla}`} />
          <SubscriptionPlanItem text={subscriptionPlan.backend} />
          {subscriptionPlan?.customContainers ? (
            <SubscriptionPlanItem text={formatMessage(messages.containers)} />
          ) : null}
        </ul>
      </div>
      {mayEditSubscriptions && subscriptionPlan.name !== 'free' ? (
        <footer className="card-footer is-flex mt-auto">
          {active ? (
            cancelled ? (
              <div className="card-footer-item">
                <Button
                  className="button is-link is-fullwidth"
                  component={Link}
                  to={`activate/${subscriptionPlan.name}`}
                >
                  <FormattedMessage {...messages.extend} />
                </Button>
              </div>
            ) : (
              <div className="card-footer-item">
                <button
                  className="button is-danger is-fullwidth"
                  onClick={toggleCancel}
                  type="button"
                >
                  <FormattedMessage {...messages.cancel} />
                </button>
              </div>
            )
          ) : (
            <div className="card-footer-item">
              <Button
                className="is-link is-fullwidth"
                component={Link}
                to={`activate/${subscriptionPlan.name}`}
              >
                <FormattedMessage {...messages.switch} />
              </Button>
            </div>
          )}
        </footer>
      ) : null}
    </article>
  );
}
