import {
  Content,
  Loader,
  Message,
  OAuth2LoginButton,
  Title,
  useLocationString,
  useMessages,
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

interface ConnectedAccountsState {
  [authorizationUrl: string]: boolean;
}

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

  const [isLoading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [accounts, setAccounts] = React.useState<ConnectedAccountsState>(null);

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
      setAccounts({
        ...accounts,
        [authorizationUrl]: false,
      });
    },
    [accounts, formatMessage, push],
  );

  React.useEffect(() => {
    axios
      .get<ConnectedAccount[]>('/api/oauth2/connected')
      .then(({ data }) =>
        setAccounts(
          data.reduce((acc, { authorizationUrl }) => {
            acc[authorizationUrl] = true;
            return acc;
          }, {} as ConnectedAccountsState),
        ),
      )
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (isLoading) {
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
          accounts[provider.authorizationUrl] ? (
            <AsyncButton
              key={`${provider.authorizationUrl} ${provider.clientId}`}
              className={styles.button}
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
              className={styles.button}
              clientId={provider.clientId}
              icon={provider.icon}
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
