import { Button } from '@appsemble/react-components';
import { type Organization, type OrganizationSubscription } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { messages } from './messages.js';

interface SuccessBoxProps {
  /**
   * The organization associated with the subscription.
   */
  readonly organization: Organization;
}

enum PaymentStatus {
  Pending,
  Paid,
  Failed,
}

export function SuccessBox({ organization }: SuccessBoxProps): ReactNode {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(PaymentStatus.Pending);
  const { subscriptionPlanName } = useParams<{ subscriptionPlanName: string }>();
  const [organizationSubscription, setOrganizationSubscription] =
    useState<OrganizationSubscription>();

  const updateStatus = (): void => {
    let retries = 0;

    const interval = async (): Promise<void> => {
      const response = await axios.get(`/api/organizations/${organization.id}/subscription`);
      if (response?.data?.subscriptionPlan === subscriptionPlanName && !response.data.cancelled) {
        setPaymentStatus(PaymentStatus.Paid);
        setOrganizationSubscription(response.data);
        return;
      }
      if (retries > 24) {
        setPaymentStatus(PaymentStatus.Failed);
        return;
      }
      retries += 1;
      setTimeout(interval, 5000);
    };

    interval();
  };

  function renderStatus(): ReactNode {
    switch (paymentStatus) {
      case PaymentStatus.Pending:
        updateStatus();
        return (
          <div className="column is-half">
            <div className="box">
              <FormattedMessage {...messages.paymentPending} />
            </div>
          </div>
        );
      case PaymentStatus.Paid:
        return (
          <div className="column is-half">
            <div className="box">
              <FormattedMessage {...messages.paymentSucceeded} />
            </div>
            <div className="box has-background-light">
              <table>
                <tbody>
                  <tr>
                    <td className="px-6">
                      <FormattedMessage {...messages.expirationDate} />
                    </td>
                    <td>
                      {new Date(organizationSubscription.expirationDate)
                        .toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })
                        .replaceAll('/', '-')}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6">
                      <FormattedMessage {...messages.subscriptionPlan} />
                    </td>
                    <td>{organizationSubscription.subscriptionPlan}</td>
                  </tr>
                  <tr>
                    <td className="px-6">
                      <FormattedMessage {...messages.renewalPeriod} />
                    </td>
                    <td>{organizationSubscription.renewalPeriod}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case PaymentStatus.Failed:
        return (
          <div className="column is-half">
            <div className="box">
              <FormattedMessage {...messages.paymentFailed} />
            </div>
          </div>
        );
      default:
        return (
          <div className="column is-half">
            <div className="box">
              <FormattedMessage {...messages.paymentPending} />
            </div>
          </div>
        );
    }
  }

  return (
    <>
      <div className="title is-3">
        <FormattedMessage {...messages.purchaseSuccessful} />
      </div>
      {renderStatus()}
      <div className="mt-5 column is-half is-flex is-justify-content-flex-end">
        <Button color="primary" component={Link} to="../invoices">
          <FormattedMessage {...messages.finish} />
        </Button>
      </div>
    </>
  );
}
