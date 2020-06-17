import { Content, Loader, Message, OAuth2LoginButton, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { clearOAuth2State, loadOAuth2State } from '@appsemble/web-utils';
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
  const query = useQuery();
  const code = query.get('code');
  const errorMessage = query.get('error');
  const state = query.get('state');

  const session = React.useMemo(() => loadOAuth2State<{}>(), []);
  const { authorizationCodeLogin, isLoggedIn } = useUser();
  const { definition } = useAppDefinition();

  const [error, setError] = React.useState(false);

  const stateOk = state && session.state && state === session.state;
  const isOk = code && !errorMessage && !error && !isLoggedIn && stateOk;

  React.useEffect(() => {
    if (isOk) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}${window.location.pathname}`,
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code, isOk]);

  React.useEffect(() => {
    if (isLoggedIn) {
      clearOAuth2State();
    }
  }, [isLoggedIn]);

  if (isLoggedIn) {
    return <Redirect to={session.redirect || normalize(definition.defaultPage)} />;
  }

  if (!isOk) {
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
          redirect={session.redirect}
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
