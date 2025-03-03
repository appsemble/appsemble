import { Button, Title, useToggle } from '@appsemble/react-components';
import { type AppWebhookSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';

import styles from './index.module.css';
import { useApp } from '../../../index.js';
import { WebhookSecretsModal } from '../WebhookSecretModal/index.js';

interface WebhookSecretItemProps {
  /**
   * Called when the secret has been updated successfully.
   *
   * @param newSecret The new secret values.
   * @param oldSecret The old secret values to replace.
   */

  readonly onUpdated: (newSecret: AppWebhookSecret, oldSecret: AppWebhookSecret) => void;

  /**
   * The current webhook secret values.
   */
  readonly secret: AppWebhookSecret;

  /**
   * Called when the webhook secret has been deleted successfully.
   */
  readonly onDeleted: (secret: AppWebhookSecret) => void;
}

/**
 * Render an app webhook secret that may be updated.
 */
export function WebhookSecretItem({
  onDeleted,
  onUpdated,
  secret,
}: WebhookSecretItemProps): ReactNode {
  const modal = useToggle();
  const { app } = useApp();

  const onSubmit = useCallback(
    async (values: AppWebhookSecret) => {
      const { data } = await axios.put<AppWebhookSecret>(
        `/api/apps/${app.id}/secrets/webhook/${secret.id}`,
        values,
      );
      modal.disable();
      onUpdated(data, secret);
    },
    [app, modal, onUpdated, secret],
  );

  return (
    <>
      <li className="mr-2 mb-2">
        <Button
          className={`is-flex is-flex-direction-row is-align-items-center ${styles.content}`}
          onClick={modal.enable}
        >
          <Title className="is-marginless mr-2" size={5}>
            {secret.name ?? 'Webhook secret'}
          </Title>
        </Button>
      </li>
      <WebhookSecretsModal onDeleted={onDeleted} secret={secret} submit={onSubmit} toggle={modal} />
    </>
  );
}
