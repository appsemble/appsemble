import { Content, OAuth2LoginButton, useQuery, useToggle } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { apiUrl, appId, logins } from '../../utils/settings';
import styles from './index.css';
import { messages } from './messages';

export function OpenIDLogin(): ReactElement {
  const qs = useQuery();
  const busy = useToggle();

  const buttonProps = {
    className: `is-fullwidth my-2 ${styles.button}`,
    clientId: `app:${appId}`,
    onClick: busy.enable,
    redirectUrl: '/Callback',
    scope: 'email openid profile resources:manage',
    redirect: qs.get('redirect'),
  };

  return (
    <Content className={`is-flex ${styles.root}`} main padding>
      <OAuth2LoginButton
        authorizationUrl={String(new URL('/connect/authorize', apiUrl))}
        icon="user"
        {...buttonProps}
      >
        <FormattedMessage {...messages.loginWith} values={{ name: 'Appsemble' }} />
      </OAuth2LoginButton>
      {logins?.map(({ icon, id, name }) => (
        <OAuth2LoginButton
          authorizationUrl={String(new URL(`/connect/authorize/${id}`, apiUrl))}
          icon={icon}
          key={id}
          {...buttonProps}
        >
          <FormattedMessage {...messages.loginWith} values={{ name }} />
        </OAuth2LoginButton>
      ))}
    </Content>
  );
}
