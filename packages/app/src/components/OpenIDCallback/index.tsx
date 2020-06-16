import { Content, Loader, Message, OAuth2LoginButton, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.css';
import messages from './messages';

/**
 * Handle the OAuth2 callback.
 */
export default function OpenIDCallback(): React.ReactElement {
  const { redirect } = localStorage;
  const query = useQuery();
  const code = query.get('code');
  const errorMessage = query.get('error');
  const { authorizationCodeLogin, isLoggedIn } = useUser();
  const { definition } = useAppDefinition();

  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (code && !errorMessage) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}${window.location.pathname}`,
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code, errorMessage]);

  if (isLoggedIn) {
    return <Redirect to={redirect || normalize(definition.defaultPage)} />;
  }

  if (!code || error) {
    return (
      <Content className={styles.error} padding>
        <Message color="danger">
          {errorMessage === 'access_denied' ? (
            <FormattedMessage {...messages.accessDenied} />
          ) : (
            <FormattedMessage {...messages.error} />
          )}
        </Message>
        <OAuth2LoginButton
          authorizationUrl={String(new URL('/connect/authorize', settings.apiUrl))}
          clientId={`app:${settings.id}`}
          icon="user"
          redirectUrl="/Callback"
          scope="email openid profile resources:manage"
        >
          <FormattedMessage {...messages.retry} />
        </OAuth2LoginButton>
      </Content>
    );
  }

  return <Loader />;
}
