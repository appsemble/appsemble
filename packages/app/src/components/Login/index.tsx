import { Content, Message, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import { getDefaultPageName } from '../../utils/getDefaultPageName';
import { apiUrl, appId, appUpdated, logins, showAppsembleLogin } from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { Main } from '../Main';
import { OpenIDLogin } from '../OpenIDLogin';
import { TitleBar } from '../TitleBar';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

export function Login(): ReactElement {
  const { definition } = useAppDefinition();
  const { isLoggedIn, role } = useUser();
  const qs = useQuery();
  const redirect = qs.get('redirect');

  if (isLoggedIn || !definition.security) {
    const defaultPageName = getDefaultPageName(isLoggedIn, role, definition);
    return <Redirect to={redirect || normalize(defaultPageName)} />;
  }

  if (!logins.length && !showAppsembleLogin) {
    return (
      <Content padding>
        <Message color="danger">
          <FormattedMessage
            {...messages.permissionError}
            values={{
              link: (text: string) => (
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
    <Main className={styles.root}>
      <TitleBar />
      <Content className={`is-flex appsemble-login ${styles.wrapper}`} padding>
        <figure className="my-4">
          <img alt={definition.name} src={`/icon-256.png?updated=${appUpdated}`} />
        </figure>
        <OpenIDLogin />
      </Content>
    </Main>
  );
}
