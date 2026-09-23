import { normalize } from '@appsemble/lang-sdk';
import { Button, Message, useMeta, useQuery } from '@appsemble/react-components';
import { clearOAuth2State, loadOAuth2State, type OAuth2State } from '@appsemble/web-utils';
import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Navigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { startAccountLinking } from '../../utils/accountLinking.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { BuiltinPage, BuiltinPageLoader } from '../BuiltinPage/index.js';

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

  const shouldLink = startAccountLinking({
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    externalId: sub,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    secret,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    email,
    showAppsembleOAuth2Login,
    showAppsembleLogin,
    // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
    logins,
  });

  const session = useMemo(() => loadOAuth2State<OAuth2State>(), []);
  const { appMemberRoles, authorizationCodeLogin, isLoggedIn, totpPending } = useAppMember();

  const { definition } = useAppDefinition();

  const [error, setError] = useState(false);

  const { redirect } = session;
  const stateOk = state && session.state && state === session.state;
  const isOk = code && !errorMessage && !error && !isLoggedIn && stateOk;

  useEffect(() => {
    if (isOk && !shouldLink) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}/Callback`,
        // The OAuth2 state is cleared as soon as this component is done with it, so the deep link
        // has to be handed to the provider, which owns the navigation from here on.
        ...(redirect ? { redirect } : {}),
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code, isOk, redirect, shouldLink]);

  useEffect(() => {
    // A pending TOTP challenge navigates away from this component just like a completed login
    // does, so the stored OAuth2 state is equally spent.
    if (isLoggedIn || totpPending) {
      clearOAuth2State();
    }
  }, [isLoggedIn, totpPending]);

  if (shouldLink) {
    return <Navigate to="/Login" />;
  }

  // The authorization code was valid, but a second factor still has to be verified, which happens
  // on the login page.
  if (totpPending) {
    return <Navigate to="/Login" />;
  }

  if (isLoggedIn) {
    const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRoles, definition);
    return <Navigate to={showDemoLogin ? '/Login' : redirect || normalize(defaultPageName)} />;
  }

  if (!isOk) {
    return (
      <BuiltinPage
        className={styles.error}
        narrow
        page="openid-callback"
        state="error"
        title={messages.login}
      >
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
      </BuiltinPage>
    );
  }

  return (
    <BuiltinPage page="openid-callback" state="loading" title={messages.login}>
      <BuiltinPageLoader />
    </BuiltinPage>
  );
}
