import { Content, Loader, Message, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { clearOAuth2State, loadOAuth2State } from '@appsemble/web-utils';
import React, { ReactElement, useEffect, useMemo, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

/**
 * Handle the OAuth2 callback.
 */
export function OpenIDCallback(): ReactElement {
  const query = useQuery();
  const code = query.get('code');
  const errorMessage = query.get('error');
  const state = query.get('state');

  const session = useMemo(() => loadOAuth2State(), []);
  const { authorizationCodeLogin, isLoggedIn } = useUser();
  const { definition } = useAppDefinition();

  const [error, setError] = useState(false);

  const { redirect } = session;
  const stateOk = state && session.state && state === session.state;
  const isOk = code && !errorMessage && !error && !isLoggedIn && stateOk;

  useEffect(() => {
    if (isOk) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}/Callback`,
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code, isOk]);

  useEffect(() => {
    if (isLoggedIn) {
      clearOAuth2State();
    }
  }, [isLoggedIn]);

  if (isLoggedIn) {
    return <Redirect to={redirect || normalize(definition.defaultPage)} />;
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
        <Link
          className="button"
          to={{ pathname: '/Login', search: String(new URLSearchParams({ redirect })) }}
        >
          <FormattedMessage {...messages.retry} />
        </Link>
      </Content>
    );
  }

  return <Loader />;
}
