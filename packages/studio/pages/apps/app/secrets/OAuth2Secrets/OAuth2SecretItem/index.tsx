import { useToggle } from '@appsemble/react-components';
import { AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';

import { useApp } from '../../..';
import { ListButton } from '../../../../../../components/ListButton';
import { OAuth2Modal } from '../OAuth2Modal';

interface OAuth2SecretItemProps {
  /**
   * Called when the provider has been updated successfully.
   *
   * @param newProvider The new provider values.
   * @param oldProvider The old provider values to replace..
   */
  onUpdated: (newProvider: AppOAuth2Secret, oldProvider: AppOAuth2Secret) => void;

  /**
   * The current provider values.
   */
  secret: AppOAuth2Secret;

  /**
   * Called when secret has been deleted successfully.
   */
  onDeleted: (secret: AppOAuth2Secret) => void;
}

/**
 * Render an OAuth2 app secret that may be updated.
 */
export function OAuth2SecretItem({
  onDeleted,
  onUpdated,
  secret,
}: OAuth2SecretItemProps): ReactElement {
  const modal = useToggle();
  const { app } = useApp();

  const onSubmit = useCallback(
    async ({ remapper, scope, ...values }: AppOAuth2Secret) => {
      const { data } = await axios.put<AppOAuth2Secret>(
        `/api/apps/${app.id}/secrets/oauth2/${secret.id}`,
        { ...values, remapper: remapper || undefined, scope: [].concat(scope).sort().join(' ') },
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
