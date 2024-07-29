import { Button, Content, Loader, Message, useMeta, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { clearOAuth2State, loadOAuth2State, type OAuth2State } from '@appsemble/web-utils';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Navigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { useStartAccountLinking } from '../../utils/accountLinking.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { Main } from '../Main/index.js';
import { AppBar } from '../TitleBar/index.js';

/**
 * Handle the OAuth2 callback.
 */
export function OpenIDCallback(): ReactNode {
  useMeta(messages.login);

  const query = useQuery();
  const code = query.get('code');
  const errorMessage = query.get('error');
  const state = query.get('state');

  const sub = query.get('externalId');
  const secret = query.get('secret');
  const email = query.get('email');
  const showAppsembleOAuth2Login = query.get('user') === 'true';
  const showAppsembleLogin = query.get('password') === 'true';
  const logins = query.get('logins');

  const { navigate, shouldLink } = useStartAccountLinking({
    externalId: sub,
    secret,
    email,
    showAppsembleOAuth2Login,
    showAppsembleLogin,
    logins,
  });

  const session = useMemo(() => loadOAuth2State<OAuth2State>(), []);
  const { authorizationCodeLogin, isLoggedIn, role } = useAppMember();

  const { definition } = useAppDefinition();

  const [error, setError] = useState(false);

  const { redirect } = session;
  const stateOk = state && session.state && state === session.state;
  const isOk = code && !errorMessage && !error && !isLoggedIn && stateOk;

  useEffect(() => {
    if (shouldLink) {
      navigate();
    }
    if (isOk && !shouldLink) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}/Callback`,
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code, isOk, shouldLink, navigate]);

  useEffect(() => {
    if (isLoggedIn) {
      clearOAuth2State();
    }
  }, [isLoggedIn]);

  if (isLoggedIn) {
    const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
    return <Navigate to={showDemoLogin ? '/Login' : redirect || normalize(defaultPageName)} />;
  }

  if (!isOk) {
    return (
      <Main>
        <AppBar />
        <Content className={styles.error} padding>
          <Message color="danger">
            {errorMessage === 'access_denied' ? (
              <FormattedMessage {...messages.accessDenied} />
            ) : (
              <FormattedMessage {...messages.error} />
            )}
          </Message>
          <Button
            component={Link}
            to={{ pathname: '/Login', search: String(new URLSearchParams({ redirect })) }}
          >
            <FormattedMessage {...messages.retry} />
          </Button>
        </Content>
      </Main>
    );
  }

  return <Loader />;
}
