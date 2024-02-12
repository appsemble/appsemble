import { Button, useData, useToggle } from '@appsemble/react-components';
import { type AppServiceSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { ServiceSecretItem } from './ServiceSecretItem/index.js';
import { ServiceSecretsModal } from './ServiceSecretModal/index.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { useApp } from '../../index.js';

const initialSecret: AppServiceSecret = {
  name: '',
  urlPatterns: '',
  authenticationMethod: 'http-basic',
  identifier: '',
  secret: '',
  tokenUrl: '',
};

/**
 * Render a CRUD interface for managing app service secrets.
 */
export function ServiceSecrets(): ReactNode {
  const { app } = useApp();
  const modal = useToggle();

  const result = useData<AppServiceSecret[]>(`/api/apps/${app.id}/secrets/service`);
  const { setData: setAppServiceSecret } = result;

  const onUpdated = useCallback(
    (newSecret: AppServiceSecret, oldSecret: AppServiceSecret) => {
      setAppServiceSecret((serviceSecret) =>
        serviceSecret.map((secret) => (secret.id === oldSecret.id ? newSecret : secret)),
      );
    },
    [setAppServiceSecret],
  );

  const create = useCallback(
    async ({ id, ...values }: AppServiceSecret) => {
      const { data } = await axios.post(`/api/apps/${app.id}/secrets/service`, values);
      setAppServiceSecret((serviceSecret) => [...serviceSecret, data]);
    },
    [app.id, setAppServiceSecret],
  );

  const onDeleted = useCallback(
    (selected: AppServiceSecret) => {
      setAppServiceSecret((serviceSecret) =>
        serviceSecret.filter((secret) => secret.id !== selected.id),
      );
    },
    [setAppServiceSecret],
  );

  return (
    <div className="mb-3">
      <HeaderControl
        control={
          <Button disabled={app.locked !== 'unlocked'} icon="plus" onClick={modal.enable}>
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
          <ul className="is-flex is-flex-direction-column my-4">
            {secrets.map((serviceSecret) => (
              <ServiceSecretItem
                key={serviceSecret.id}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
                secret={serviceSecret}
              />
            ))}
          </ul>
        )}
      </AsyncDataView>
      <ServiceSecretsModal secret={initialSecret} submit={create} toggle={modal} />
    </div>
  );
}
