import { normalize } from '@appsemble/lang-sdk';
import { Message, useQuery } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import {
  apiUrl,
  appId,
  appUpdated,
  development,
  logins,
  showAppsembleLogin,
  showAppsembleOAuth2Login,
  showDemoLogin,
} from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { useAppMember } from '../AppMemberProvider/index.js';
import { BuiltinPage } from '../BuiltinPage/index.js';
import { DemoLogin } from '../DemoLogin/index.js';
import { MainLogin } from '../MainLogin/index.js';

type LoginState = 'demo' | 'form' | 'permission-error' | 'totp-setup' | 'totp';

export function Login(): ReactNode {
  const { definition } = useAppDefinition();
  const { appMemberRoles, isLoggedIn, totpPending } = useAppMember();
  const qs = useQuery();
  const redirect = qs.get('redirect');

  if (isLoggedIn || !definition.security) {
    const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRoles, definition);
    return <Navigate to={redirect || normalize(defaultPageName)} />;
  }

  const hasNoLogin =
    !logins.length && !showAppsembleOAuth2Login && !showAppsembleLogin && !development;

  let state: LoginState;
  if (hasNoLogin) {
    state = 'permission-error';
  } else if (showDemoLogin) {
    // The demo login is shown regardless of a pending TOTP login.
    state = 'demo';
  } else if (totpPending) {
    state = totpPending.totpEnabled ? 'totp' : 'totp-setup';
  } else {
    state = 'form';
  }

  if (state === 'permission-error') {
    return (
      <BuiltinPage narrow page="login" state={state} title={messages.login}>
        <Message color="danger">
          <FormattedMessage
            {...messages.permissionError}
            values={{
              link: (text) => (
                <a href={`${apiUrl}/apps/${appId}`} rel="noopener noreferrer" target="_blank">
                  {text}
                </a>
              ),
            }}
          />
        </Message>
      </BuiltinPage>
    );
  }

  return (
    <BuiltinPage
      className="appsemble-login"
      fallbackClassName={`is-flex is-flex-direction-column is-justify-content-center is-align-items-center ${styles.content}`}
      fallbackRootClassName={styles.root}
      narrow
      page="login"
      state={state}
      title={messages.login}
    >
      <figure className="py-4">
        <img
          alt={definition.name}
          className={styles.logo}
          src={`/icon-256.png?updated=${appUpdated}`}
        />
      </figure>
      {showDemoLogin ? <DemoLogin /> : <MainLogin />}
    </BuiltinPage>
  );
}
