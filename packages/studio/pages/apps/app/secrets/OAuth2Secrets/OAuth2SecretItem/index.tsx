import { useToggle } from '@appsemble/react-components';
import { type AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';

import { ListButton } from '../../../../../../components/ListButton/index.js';
import { useApp } from '../../../index.js';
import { OAuth2Modal } from '../OAuth2Modal/index.js';

interface OAuth2SecretItemProps {
  /**
   * Called when the provider has been updated successfully.
   *
   * @param newProvider The new provider values.
   * @param oldProvider The old provider values to replace..
   */
  readonly onUpdated: (newProvider: AppOAuth2Secret, oldProvider: AppOAuth2Secret) => void;

  /**
   * The current provider values.
   */
  readonly secret: AppOAuth2Secret;

  /**
   * Called when secret has been deleted successfully.
   */
  readonly onDeleted: (secret: AppOAuth2Secret) => void;
}

/**
 * Render an OAuth2 app secret that may be updated.
 */
export function OAuth2SecretItem({
  onDeleted,
  onUpdated,
  secret,
}: OAuth2SecretItemProps): ReactNode {
  const modal = useToggle();
  const { app } = useApp();

  const onSubmit = useCallback(
    async ({ remapper, scope, userInfoUrl, ...values }: AppOAuth2Secret) => {
      const { data } = await axios.put<AppOAuth2Secret>(
        `/api/apps/${app.id}/secrets/oauth2/${secret.id}`,
        {
          ...values,
          remapper: remapper || undefined,
          userInfoUrl: userInfoUrl || undefined,
          scope: [].concat(scope).sort().join(' '),
        },
      );
      modal.disable();
      onUpdated(data, secret);
    },
    [app, modal, onUpdated, secret],
  );

  return (
    <>
      <ListButton
        description={secret.scope}
        icon={secret.icon}
        onClick={modal.enable}
        subtitle={new URL(secret.authorizationUrl).origin}
        title={secret.name}
      />
      <OAuth2Modal onDeleted={onDeleted} onSubmit={onSubmit} secret={secret} toggle={modal} />
    </>
  );
}
