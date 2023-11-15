import {
  AsyncButton,
  Content,
  Loader,
  Message,
  OAuth2LoginButton,
  Title,
  useData,
  useLocationString,
  useMessages,
  useMeta,
  useToggle,
} from '@appsemble/react-components';
import { type OAuth2Provider } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import { logins } from '../../../utils/settings.js';

interface ConnectedAccount {
  authorizationUrl: string;
}

/**
 * Managed OAuth2 accounts linked to the current user.
 */
export function SocialPage(): ReactNode {
  useMeta(messages.title);

  const { formatMessage } = useIntl();
  const push = useMessages();
  const location = useLocationString();
  const connecting = useToggle();

  const {
    data: accounts,
    error,
    loading,
    setData: setAccounts,
  } = useData<ConnectedAccount[]>('/api/oauth2/connected');

  const disconnect = useCallback(
    async ({ authorizationUrl, name }: OAuth2Provider) => {
      try {
        await axios.delete('/api/oauth2/connected', { params: { authorizationUrl } });
      } catch {
        push(formatMessage(messages.disconnectError, { name }));
        return;
      }
      push({
        body: formatMessage(messages.disconnectSuccess, { name }),
        color: 'success',
      });
      setAccounts(accounts.filter((account) => account.authorizationUrl !== authorizationUrl));
    },
    [accounts, formatMessage, push, setAccounts],
  );

  if (loading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.error} />
      </Message>
    );
  }

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      {logins.map((provider) =>
        accounts.some((account) => account.authorizationUrl === provider.authorizationUrl) ? (
          <AsyncButton
            className={`${styles.button} mb-4`}
            disabled={connecting.enabled}
            icon={provider.icon}
            key={provider.authorizationUrl}
            onClick={() => disconnect(provider)}
          >
            <FormattedMessage {...messages.disconnectAccount} values={{ name: provider.name }} />
          </AsyncButton>
        ) : (
          <OAuth2LoginButton
            authorizationUrl={provider.authorizationUrl}
            className={`${styles.button} mb-4`}
            clientId={provider.clientId}
            disabled={connecting.enabled}
            icon={provider.icon}
            key={provider.authorizationUrl}
            onClick={connecting.enable}
            redirect={location}
            redirectUrl="/callback"
            scope={provider.scope}
          >
            <FormattedMessage {...messages.connectAccount} values={{ name: provider.name }} />
          </OAuth2LoginButton>
        ),
      )}
    </Content>
  );
}
