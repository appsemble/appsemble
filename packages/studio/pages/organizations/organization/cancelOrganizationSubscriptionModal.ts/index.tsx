import {
  CardFooterButton,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  type Toggle,
  useMessages,
} from '@appsemble/react-components';
import { type OrganizationSubscription } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';

interface CancelOrganizationSubscriptionModalProps {
  /**
   * The state of the modal.
   */
  readonly state: Toggle;

  /**
   * The subscription user wants to cancel.
   */
  readonly subscription: OrganizationSubscription;
}

export function CancelOrganizationSubscriptionModal({
  state,
  subscription,
}: CancelOrganizationSubscriptionModalProps): ReactNode {
  const [submitting, setSubmitting] = useState(false);
  const push = useMessages();
  const { formatMessage } = useIntl();

  const defaultValues = useMemo(
    () => ({
      cancelled: true,
      cancellationReason: subscription?.cancellationReason || '',
    }),
    [subscription],
  );

  const onSubmit = useCallback(
    async ({ cancellationReason }: typeof defaultValues) => {
      setSubmitting(true);
      const formData = new FormData();
      formData.set('cancelled', 'true');
      formData.set('cancellationReason', cancellationReason);
      try {
        await axios.patch(`/api/organization-subscriptions/${subscription.id}`, formData);
      } catch {
        setSubmitting(false);
        push(formatMessage(messages.error));
        return;
      }
      state.disable();
      setSubmitting(false);
    },
    [formatMessage, push, state, subscription],
  );

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={defaultValues}
      footer={
        <>
          <CardFooterButton onClick={state.toggle}>
            <FormattedMessage {...messages.keepSubscription} />
          </CardFooterButton>
          <CardFooterButton color="primary" type="submit">
            <FormattedMessage {...messages.cancelSubscription} />
          </CardFooterButton>
        </>
      }
      isActive={state.enabled}
      onClose={state.disable}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.title} />}
    >
      <SimpleFormField
        disabled={submitting}
        help={<FormattedMessage {...messages.help} />}
        label={<FormattedMessage {...messages.cancellationReason} />}
        name="cancellationReason"
        type="text"
      />
    </ModalCard>
  );
}
