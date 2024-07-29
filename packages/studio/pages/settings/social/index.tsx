import {
  AsyncButton,
  Content,
  Loader,
  Message,
  SSOLoginButton,
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
import { useUser } from '../../../components/UserProvider/index.js';
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
  const { setHasNoLoginMethods } = useUser();

  const {
    data: accounts,
    error,
    loading,
    setData: setAccounts,
  } = useData<ConnectedAccount[]>('/api/users/current/auth/oauth2/authorizations');

  const disconnect = useCallback(
    async ({ authorizationUrl, name }: OAuth2Provider) => {
      try {
        const { data: hasNoLoginMethods } = await axios.delete<boolean>(
          '/api/users/current/auth/oauth2/authorizations',
          {
            params: { authorizationUrl },
          },
        );
        setHasNoLoginMethods(hasNoLoginMethods);
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
    [accounts, formatMessage, push, setAccounts, setHasNoLoginMethods],
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
          <SSOLoginButton
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
          </SSOLoginButton>
        ),
      )}
    </Content>
  );
}
