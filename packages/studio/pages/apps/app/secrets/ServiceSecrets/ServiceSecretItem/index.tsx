import { Button, Subtitle, Title, useToggle } from '@appsemble/react-components';
import { type AppServiceSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useApp } from '../../../index.js';
import { ServiceSecretsModal } from '../ServiceSecretModal/index.js';

interface ServiceSecretItemProps {
  /**
   * Called when the secret has been updated successfully.
   *
   * @param newSecret The new secret values.
   * @param oldSecret The old secret values to replace.
   */

  readonly onUpdated: (newSecret: AppServiceSecret, oldSecret: AppServiceSecret) => void;

  /**
   * The current service secret values.
   */
  readonly secret: AppServiceSecret;

  /**
   * Called when the service secret has been deleted successfully.
   */
  readonly onDeleted: (secret: AppServiceSecret) => void;
}

/**
 * Render an app service secret that may be updated.
 */
export function ServiceSecretItem({
  onDeleted,
  onUpdated,
  secret,
}: ServiceSecretItemProps): ReactNode {
  const modal = useToggle();
  const { app } = useApp();

  const onSubmit = useCallback(
    async (values: AppServiceSecret) => {
      const { data } = await axios.put<AppServiceSecret>(
        `/api/apps/${app.id}/secrets/service/${secret.id}`,
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
          className={`is-flex is-flex-direction-column is-align-items-flex-start ${styles.content}`}
          onClick={modal.enable}
        >
          <Title className="is-marginless" size={5}>
            {secret.name ?? 'Service secret'}
          </Title>
          <Title className="is-marginless" size={6}>
            <FormattedMessage {...messages[secret.authenticationMethod]} />
          </Title>
          <Subtitle className="is-marginless" size={6}>
            {secret.urlPatterns}
          </Subtitle>
        </Button>
      </li>
      <ServiceSecretsModal onDeleted={onDeleted} secret={secret} submit={onSubmit} toggle={modal} />
    </>
  );
}
