import {
  Content,
  type LoginFormValues,
  Message,
  Login as PasswordLogin,
  useMeta,
  useQuery,
  useToggle,
} from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, useParams } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { getDefaultPageName } from '../../utils/getDefaultPageName.js';
import {
  apiUrl,
  appId,
  appUpdated,
  development,
  enableSelfRegistration,
  logins,
  showAppsembleLogin,
  showAppsembleOAuth2Login,
  showDemoLogin,
} from '../../utils/settings.js';
import { useAppDefinition } from '../AppDefinitionProvider/index.js';
import { DemoLogin } from '../DemoLogin/index.js';
import { Main } from '../Main/index.js';
import { OpenIDLogin } from '../OpenIDLogin/index.js';
import { AppBar } from '../TitleBar/index.js';
import { useUser } from '../UserProvider/index.js';

export function Login(): ReactNode {
  useMeta(messages.login);

  const { definition } = useAppDefinition();
  const { isLoggedIn, passwordLogin, role } = useUser();
  const qs = useQuery();
  const redirect = qs.get('redirect');
  const { lang } = useParams<{ lang: string }>();
  const busy = useToggle(false);

  const onPasswordLogin = useCallback(
    async (credentials: LoginFormValues): Promise<void> => {
      busy.enable();
      try {
        await passwordLogin({ username: credentials.email, password: credentials.password });
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
      busy.disable();
    },
    [busy, passwordLogin],
  );

  if (isLoggedIn || !definition.security) {
    const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
    return <Navigate to={redirect || normalize(defaultPageName)} />;
  }

  if (!logins.length && !showAppsembleOAuth2Login && !showAppsembleLogin && !development) {
    return (
      <Content padding>
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
      </Content>
    );
  }

  return (
    <Main className={`is-flex ${styles.root}`}>
      <AppBar />
      <Content
        className="is-flex is-flex-direction-column is-justify-content-center is-align-items-center is-flex-grow-1 appsemble-login"
        padding
      >
        <figure className="py-4">
          <img
            alt={definition.name}
            className={styles.logo}
            src={`/icon-256.png?updated=${appUpdated}`}
          />
        </figure>
        {showDemoLogin ? (
          <DemoLogin />
        ) : (
          <>
            {showAppsembleLogin ? (
              <PasswordLogin
                enableRegistration={enableSelfRegistration}
                onPasswordLogin={onPasswordLogin}
                registerLink={`/${lang}/Register`}
                resetPasswordLink={`/${lang}/Reset-Password`}
              />
            ) : null}
            <OpenIDLogin disabled={busy.enabled} />
          </>
        )}
      </Content>
    </Main>
  );
}
