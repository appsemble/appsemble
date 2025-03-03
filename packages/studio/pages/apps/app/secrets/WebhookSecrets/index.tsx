import { Button, useData, useToggle } from '@appsemble/react-components';
import { type AppWebhookSecret } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { WebhookSecretItem } from './WebhookSecretItem/index.js';
import { WebhookSecretsModal } from './WebhookSecretModal/index.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { HeaderControl } from '../../../../../components/HeaderControl/index.js';
import { useApp } from '../../index.js';

const initialSecret: AppWebhookSecret = {
  id: 0,
  name: '',
};

/**
 * Render a CRUD interface for managing app webhook secrets.
 */
export function WebhookSecrets(): ReactNode {
  const { app } = useApp();
  const modal = useToggle();

  const result = useData<AppWebhookSecret[]>(`/api/apps/${app.id}/secrets/webhook`);
  const { setData: setAppWebhookSecret } = result;

  const onUpdated = useCallback(
    (newSecret: AppWebhookSecret, oldSecret: AppWebhookSecret) => {
      setAppWebhookSecret((webhookSecret) =>
        webhookSecret.map((secret) => (secret.id === oldSecret.id ? newSecret : secret)),
      );
    },
    [setAppWebhookSecret],
  );

  const create = useCallback(
    async ({ id, ...values }: AppWebhookSecret) => {
      const { data } = await axios.post(`/api/apps/${app.id}/secrets/webhook`, values);
      setAppWebhookSecret((webhookSecret) => [...webhookSecret, data]);
    },
    [app.id, setAppWebhookSecret],
  );

  const onDeleted = useCallback(
    (selected: AppWebhookSecret) => {
      setAppWebhookSecret((webhookSecret) =>
        webhookSecret.filter((secret) => secret.id !== selected.id),
      );
    },
    [setAppWebhookSecret],
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
            {secrets.map((webhookSecret) => (
              <WebhookSecretItem
                key={webhookSecret.id}
                onDeleted={onDeleted}
                onUpdated={onUpdated}
                secret={webhookSecret}
              />
            ))}
          </ul>
        )}
      </AsyncDataView>
      <WebhookSecretsModal secret={initialSecret} submit={create} toggle={modal} />
    </div>
  );
}
