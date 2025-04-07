import { normalize } from '@appsemble/lang-sdk';
import { Content, Message, useMeta, useQuery } from '@appsemble/react-components';
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
import { DemoLogin } from '../DemoLogin/index.js';
import { Main } from '../Main/index.js';
import { MainLogin } from '../MainLogin/index.js';
import { AppBar } from '../TitleBar/index.js';

export function Login(): ReactNode {
  useMeta(messages.login);

  const { definition } = useAppDefinition();
  const { appMemberRole, isLoggedIn } = useAppMember();
  const qs = useQuery();
  const redirect = qs.get('redirect');

  if (isLoggedIn || !definition.security) {
    const defaultPageName = getDefaultPageName(isLoggedIn, appMemberRole, definition);
    return <Navigate to={redirect || normalize(defaultPageName)} />;
  }

  if (!logins.length && !showAppsembleOAuth2Login && !showAppsembleLogin && !development) {
    return (
      <Content padding>
        <AppBar />
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
        {showDemoLogin ? <DemoLogin /> : <MainLogin />}
      </Content>
    </Main>
  );
}
