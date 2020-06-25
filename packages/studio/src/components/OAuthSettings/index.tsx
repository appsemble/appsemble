import {
  Content,
  Loader,
  Message,
  OAuth2LoginButton,
  Title,
  useData,
  useLocationString,
  useMessages,
  useToggle,
} from '@appsemble/react-components';
import type { OAuth2Provider } from '@appsemble/types';
import axios from 'axios';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import settings from '../../utils/settings';
import AsyncButton from '../AsyncButton';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

interface ConnectedAccount {
  authorizationUrl: string;
}

/**
 * Managed OAuth2 accounts linked to the current user.
 */
export default function OAuthSettings(): React.ReactElement {
  const { formatMessage } = useIntl();
  const push = useMessages();
  const location = useLocationString();
  const connecting = useToggle();

  const { data: accounts, error, loading, setData: setAccounts } = useData<ConnectedAccount[]>(
    '/api/oauth2/connected',
  );

  const disconnect = React.useCallback(
    async ({ authorizationUrl, name }: OAuth2Provider) => {
      try {
        await axios.delete('/api/oauth2/connected', { params: { authorizationUrl } });
      } catch (err) {
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
      <HelmetIntl title={messages.title} />
      <Content>
        <Title>
          <FormattedMessage {...messages.header} />
        </Title>
        {settings.logins.map((provider) =>
          accounts.some((account) => account.authorizationUrl === provider.authorizationUrl) ? (
            <AsyncButton
              key={provider.authorizationUrl}
              className={`${styles.button} mb-4`}
              disabled={connecting.enabled}
              icon={provider.icon}
              iconPrefix="fab"
              onClick={() => disconnect(provider)}
            >
              <FormattedMessage {...messages.disconnectAccount} values={{ name: provider.name }} />
            </AsyncButton>
          ) : (
            <OAuth2LoginButton
              key={provider.authorizationUrl}
              authorizationUrl={provider.authorizationUrl}
              className={`${styles.button} mb-4`}
              clientId={provider.clientId}
              disabled={connecting.enabled}
              icon={provider.icon}
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
    </Content>
  );
}
