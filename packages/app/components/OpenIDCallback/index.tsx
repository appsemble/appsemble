import { getPagePathSegment, getRouteSegment } from '@appsemble/lang-sdk';
import { Button, Message } from '@appsemble/preact-components';
import { clearOAuth2State, loadOAuth2State, type OAuth2State } from '@appsemble/web-utils';
import { type VNode } from 'preact';
import { useEffect, useLayoutEffect, useMemo, useState } from 'preact/hooks';
import { Link, Redirect, useParams } from 'wouter-preact';

import styles from './index.module.css';
import { messages } from './messages.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { useMeta } from '../Meta/index.js';
import { startAccountLinking } from '../../utils/accountLinking.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import { showDemoLogin } from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { useAppMessages } from '../AppMessagesProvider/index.js';
import { BuiltinPage, BuiltinPageLoader } from '../BuiltinPage/index.js';
import { useQuery } from '../../utils/useQuery.js';

/**
 * Handle the OAuth2 callback.
 */
export function OpenIDCallback(): VNode {
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
  const { getAppMessage } = useAppMessages();

  const { definition } = useAppDefinition();
  const { lang } = useParams<{ lang: string }>();
  const loginSegment = getRouteSegment('Login', getAppMessage);

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

  // The redirects below navigate as soon as they mount, which unmounts this component before its
  // passive effects run.
  useLayoutEffect(() => {
    // A pending TOTP challenge navigates away from this component just like a completed login
    // does, so the stored OAuth2 state is equally spent.
    if (isLoggedIn || totpPending) {
      clearOAuth2State();
    }
  }, [isLoggedIn, totpPending]);

  if (shouldLink) {
    return <Redirect to={`/${loginSegment}`} />;
  }

  // The authorization code was valid, but a second factor still has to be verified, which happens
  // on the login page.
  if (totpPending) {
    return <Redirect to={`/${loginSegment}`} />;
  }

  if (isLoggedIn) {
    const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRoles, definition);
    return (
      <Redirect
        to={
          showDemoLogin
            ? `/${loginSegment}`
            : redirect || `/${lang}/${getPagePathSegment({ name: defaultPageName }, getAppMessage)}`
        }
      />
    );
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
        <Button component={Link} to={`/${loginSegment}?${new URLSearchParams({ redirect })}`}>
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
