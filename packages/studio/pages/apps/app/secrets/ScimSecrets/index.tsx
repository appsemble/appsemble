import {
  Button,
  CheckboxField,
  FormOutput,
  useConfirmation,
  useData,
  useMessages,
} from '@appsemble/react-components';
import { randomString } from '@appsemble/web-utils';
import axios from 'axios';
import { type ChangeEvent, type ReactNode, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';
import { AsyncDataView } from '../../../../../components/AsyncDataView/index.js';
import { useApp } from '../../index.js';

interface ScimSecret {
  enabled: boolean;
  incomplete: boolean;
}

export function ScimSecrets(): ReactNode {
  const { app, refreshWarnings } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();

  const url = `/api/apps/${app.id}/secrets/scim`;

  const result = useData<ScimSecret>(url);
  const [token, setToken] = useState<string>();

  const toggle = async (event: ChangeEvent, enabled: boolean): Promise<void> => {
    try {
      const { data } = await axios.patch(url, { enabled });
      result.setData(data);
      refreshWarnings();
    } catch {
      push(formatMessage(messages.submitError));
    }
  };

  const regenerate = useConfirmation({
    title: <FormattedMessage {...messages.regenerate} />,
    body: <FormattedMessage {...messages.confirmGenerateBody} />,
    cancelLabel: <FormattedMessage {...messages.cancel} />,
    confirmLabel: <FormattedMessage {...messages.confirmGenerate} />,
    async action() {
      try {
        const newToken = randomString();
        const { data } = await axios.patch(url, { token: newToken });
        result.setData(data);
        setToken(newToken);
        refreshWarnings();
      } catch {
        push(formatMessage(messages.submitError));
      }
    },
  });

  return (
    <AsyncDataView
      errorMessage={<FormattedMessage {...messages.loadingError} />}
      loadingMessage={<FormattedMessage {...messages.loadingMessage} />}
      result={result}
    >
      {(secret) => (
        <div>
          <CheckboxField
            help={<FormattedMessage {...messages.enabledHelp} />}
            label={<FormattedMessage {...messages.enabledLabel} />}
            name="enabled"
            onChange={toggle}
            value={secret.enabled}
          />
          <FormOutput
            copyErrorMessage={formatMessage(messages.tenantUrlCopyError)}
            copySuccessMessage={formatMessage(messages.tenantUrlCopySuccess)}
            help={<FormattedMessage {...messages.tenantUrlHelp} />}
            icon="user"
            label={<FormattedMessage {...messages.tenantUrlLabel} />}
            name="tenantUrl"
            type="url"
            value={`${window.location.origin}/api/apps/${app.id}/scim`}
          />
          {token ? (
            <FormOutput
              copyErrorMessage={formatMessage(messages.tokenCopyError)}
              copySuccessMessage={formatMessage(messages.tokenCopySuccess)}
              help={<FormattedMessage {...messages.tokenHelp} />}
              icon="user"
              label={<FormattedMessage {...messages.tokenLabel} />}
              name="token"
              value={token}
            />
          ) : (
            <p className="mb-3">
              <FormattedMessage
                {...(secret.incomplete ? messages.tokenMissing : messages.tokenSet)}
              />
            </p>
          )}
          <Button color="primary" onClick={regenerate}>
            <FormattedMessage {...messages.regenerate} />
          </Button>
        </div>
      )}
    </AsyncDataView>
  );
}
