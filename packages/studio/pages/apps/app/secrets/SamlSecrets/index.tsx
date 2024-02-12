import { Button, useData, useToggle } from '@appsemble/react-components';
import { type AppSamlSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { SamlModal } from './SamlModal/index.js';
import { SamlSecretItem } from './SamlSecretItem/index.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { useApp } from '../../index.js';

const initialSecret: AppSamlSecret = {
  name: '',
  icon: 'user',
  idpCertificate: '',
  entityId: '',
  ssoUrl: '',
  emailAttribute: '',
  nameAttribute: '',
};

/**
 * Render a CRUD interface for managing Saml secrets.
 */
export function SamlSecrets(): ReactNode {
  const { app } = useApp();
  const modal = useToggle();

  const result = useData<AppSamlSecret[]>(`/api/apps/${app.id}/secrets/saml`);
  const { setData: setSecrets } = result;

  const onUpdated = useCallback(
    (newSecret: AppSamlSecret, oldSecret: AppSamlSecret) => {
      setSecrets((secrets) => secrets.map((s) => (s === oldSecret ? newSecret : s)));
    },
    [setSecrets],
  );

  const create = useCallback(
    async (values: AppSamlSecret) => {
      const { data } = await axios.post<AppSamlSecret>(`/api/apps/${app.id}/secrets/saml`, values);
      modal.disable();
      setSecrets((secrets) => [...secrets, data]);
    },
    [app, modal, setSecrets],
  );

  const onDeleted = useCallback(
    (secret: AppSamlSecret) => {
      setSecrets((secrets) => secrets.filter((s) => s.id !== secret.id));
    },
    [setSecrets],
  );

  return (
    <div>
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
          <ul>
            {secrets.map((secret) => (
              <SamlSecretItem
                key={secret.id}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
                secret={secret}
              />
            ))}
          </ul>
        )}
      </AsyncDataView>
      <SamlModal onSubmit={create} secret={initialSecret} toggle={modal} />
    </div>
  );
}
