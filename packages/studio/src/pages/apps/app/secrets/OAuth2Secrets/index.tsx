import { Button, useData, useToggle } from '@appsemble/react-components';
import { AppOAuth2Secret } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../..';
import { AsyncDataView } from '../../../../../components/AsyncDataView';
import { HeaderControl } from '../../../../../components/HeaderControl';
import { messages } from './messages';
import { OAuth2Modal } from './OAuth2Modal';
import { OAuth2SecretItem } from './OAuth2SecretItem';

const initialSecret: AppOAuth2Secret = {
  authorizationUrl: '',
  clientId: '',
  clientSecret: '',
  icon: 'user',
  name: '',
  scope: 'email openid profile',
  tokenUrl: '',
  remapper: undefined,
};

/**
 * Render a CRUD interface for managing OAuth2 secrets.
 */
export function OAuth2Secrets(): ReactElement {
  const { app } = useApp();
  const modal = useToggle();

  const result = useData<AppOAuth2Secret[]>(`/api/apps/${app.id}/secrets/oauth2`);
  const { setData: setSecrets } = result;

  const onUpdated = useCallback(
    (newSecret: AppOAuth2Secret, oldSecret: AppOAuth2Secret) => {
      setSecrets((secrets) => secrets.map((s) => (s === oldSecret ? newSecret : s)));
    },
    [setSecrets],
  );

  const create = useCallback(
    async ({ remapper, scope, ...values }: AppOAuth2Secret) => {
      const { data } = await axios.post<AppOAuth2Secret>(`/api/apps/${app.id}/secrets/oauth2`, {
        ...values,
        remapper: remapper || undefined,
        scope: [].concat(scope).sort().join(' '),
      });
      modal.disable();
      setSecrets((secrets) => [...secrets, data]);
    },
    [app, modal, setSecrets],
  );

  const onDeleted = useCallback(
    (secret: AppOAuth2Secret) => {
      setSecrets((secrets) => secrets.filter((s) => s.id !== secret.id));
    },
    [setSecrets],
  );

  return (
    <div className="mb-3">
      <HeaderControl
        control={
          <Button disabled={app.locked} icon="plus" onClick={modal.enable}>
            <FormattedMessage {...messages.addNew} />
          </Button>
        }
        size={4}
      >
        <FormattedMessage {...messages.title} />
      </HeaderControl>
      <AsyncDataView
        emptyMessage={<FormattedMessage {...messages.noSecrets} />}
        errorMessage={<FormattedMessage {...messages.error} />}
        loadingMessage={<FormattedMessage {...messages.loading} />}
        result={result}
      >
        {(secrets) => (
          <ul>
            {secrets.map((secret) => (
              <OAuth2SecretItem
                key={secret.id}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
                secret={secret}
              />
            ))}
          </ul>
        )}
      </AsyncDataView>
      <OAuth2Modal onSubmit={create} secret={initialSecret} toggle={modal} />
    </div>
  );
}
