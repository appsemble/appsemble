import { Button, useData, useToggle } from '@appsemble/react-components';
import { AppSamlSecret } from '@appsemble/types';
import axios from 'axios';
import React, { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '../../AppContext';
import { AsyncDataView } from '../../AsyncDataView';
import { HeaderControl } from '../../HeaderControl';
import { messages } from './messages';
import { SamlModal } from './SamlModal';
import { SamlSecretItem } from './SamlSecretItem';

const initialSecret: AppSamlSecret = {
  name: '',
  icon: 'user',
  idpCertificate: '',
  entityId: '',
  ssoUrl: '',
};

/**
 * Render a CRUD interface for managing Saml secrets.
 */
export function SamlSecrets(): ReactElement {
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

  return (
    <>
      <HeaderControl
        control={
          <Button icon="plus" onClick={modal.enable}>
            <FormattedMessage {...messages.addNew} />
          </Button>
        }
        level={2}
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
              <SamlSecretItem key={secret.id} onUpdated={onUpdated} secret={secret} />
            ))}
          </ul>
        )}
      </AsyncDataView>
      <SamlModal onSubmit={create} secret={initialSecret} toggle={modal} />
    </>
  );
}
