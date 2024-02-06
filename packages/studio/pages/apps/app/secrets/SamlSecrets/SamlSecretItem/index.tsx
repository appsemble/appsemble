import { useToggle } from '@appsemble/react-components';
import { type AppSamlSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { useIntl } from 'react-intl';

import { messages } from './messages.js';
import { ListButton } from '../../../../../../components/ListButton/index.js';
import { useApp } from '../../../index.js';
import { SamlModal } from '../SamlModal/index.js';

interface SamlSecretItemProps {
  /**
   * Called when the provider has been updated successfully.
   *
   * @param newProvider The new provider values.
   * @param oldProvider The old provider values to replace..
   */
  readonly onUpdated: (newProvider: AppSamlSecret, oldProvider: AppSamlSecret) => void;

  /**
   * The current provider values.
   */
  readonly secret: AppSamlSecret;

  /**
   * Called when secret has been deleted successfully.
   */
  readonly onDeleted: (secret: AppSamlSecret) => void;
}

/**
 * Render an Saml app secret that may be updated.
 */
export function SamlSecretItem({ onDeleted, onUpdated, secret }: SamlSecretItemProps): ReactNode {
  const { formatMessage } = useIntl();
  const modal = useToggle();
  const { app } = useApp();

  const onSubmit = useCallback(
    async (values: AppSamlSecret) => {
      const { data } = await axios.put<AppSamlSecret>(
        `/api/apps/${app.id}/secrets/saml/${secret.id}`,
        values,
      );
      modal.disable();
      onUpdated(data, secret);
    },
    [app, modal, onUpdated, secret],
  );

  const ssoUrl = new URL(secret.ssoUrl);
  const entityId = secret.entityId ? new URL(secret.entityId) : null;

  return (
    <>
      <ListButton
        description={
          entityId
            ? entityId.origin === ssoUrl.origin
              ? entityId.pathname
              : secret.entityId
            : formatMessage(messages.certificateUploaded)
        }
        icon={secret.icon}
        onClick={modal.enable}
        subtitle={ssoUrl.origin}
        title={secret.name}
      />
      <SamlModal onDeleted={onDeleted} onSubmit={onSubmit} secret={secret} toggle={modal} />
    </>
  );
}
