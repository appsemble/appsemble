import {
  Button,
  ModalCard,
  SimpleForm,
  SimpleFormField,
  SimpleModalFooter,
  type Toggle,
  useConfirmation,
  useMessages,
} from '@appsemble/react-components';
import { type AppWebhookSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { SecretField } from './SecretField.js';
import { useApp } from '../../../index.js';

interface WebhookSecretCardProps {
  /**
   * Called when the secret has been updated successfully.
   *
   * @param secret The relevant webhook secrets to save.
   */
  readonly submit: (secret: AppWebhookSecret) => Promise<void>;

  /**
   * The current webhook secret values.
   */
  readonly secret: AppWebhookSecret;

  /**
   * The toggle used for managing the modal.
   */
  readonly toggle: Toggle;

  /**
   * Called when the webhook secret has been deleted successfully.
   */
  readonly onDeleted?: (secret: AppWebhookSecret) => void;
}

/**
 * Render a modal for editing an app webhook secret.
 */
export function WebhookSecretsModal({
  onDeleted,
  secret,
  submit,
  toggle,
}: WebhookSecretCardProps): ReactNode {
  const { formatMessage } = useIntl();
  const {
    app: { locked },
  } = useApp();

  const push = useMessages();
  const { app } = useApp();

  const onClose = useCallback(() => {
    toggle.disable();
  }, [toggle]);

  const onSubmit = useCallback(
    (values: AppWebhookSecret) => {
      submit(values);
      onClose();
    },
    [onClose, submit],
  );

  const onDelete = useConfirmation({
    title: <FormattedMessage {...messages.deleteWarningTitle} />,
    body: <FormattedMessage {...messages.deleteWarning} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.delete} />,
    color: 'danger',
    async action() {
      await axios.delete(`/api/apps/${app.id}/secrets/webhook/${secret.id}`);

      push({
        body: formatMessage(messages.deleteSuccess, { name: secret.name }),
        color: 'info',
      });
      onDeleted(secret);
    },
  });

  return (
    <ModalCard
      component={SimpleForm}
      defaultValues={secret}
      footer={
        <SimpleModalFooter
          cancelLabel={<FormattedMessage {...messages.close} />}
          onClose={onClose}
          submitLabel={<FormattedMessage {...messages.save} />}
        />
      }
      isActive={toggle.enabled}
      onClose={onClose}
      onSubmit={onSubmit}
      title={<FormattedMessage {...messages.modalTitle} />}
    >
      <p className="mb-2">
        <FormattedMessage
          {...messages.docs}
          values={{
            link: (link) => (
              <Link rel="noopener noreferrer" target="_blank" to="../../../docs/guides/webhook">
                {link}
              </Link>
            ),
          }}
        />
      </p>
      <SimpleFormField
        disabled={locked !== 'unlocked'}
        help={<FormattedMessage {...messages.nameHelp} />}
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
      />
      <SecretField appId={app.id} secretId={secret.id} />
      {onDeleted ? (
        <Button className={styles.deleteButton} color="danger" icon="trash" onClick={onDelete}>
          <FormattedMessage {...messages.deleteButton} />
        </Button>
      ) : null}
    </ModalCard>
  );
}
