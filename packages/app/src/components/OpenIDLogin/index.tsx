import { Content, OAuth2LoginButton, useQuery, useToggle } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import settings from '../../utils/settings';
import styles from './index.css';
import messages from './messages';

export default function OpenIDLogin(): React.ReactElement {
  const qs = useQuery();
  const busy = useToggle();

  const buttonProps = {
    className: styles.button,
    clientId: `app:${settings.id}`,
    onClick: busy.enable,
    redirectUrl: '/Callback',
    scope: 'email openid profile resources:manage',
    redirect: qs.get('redirect'),
  };

  return (
    <Content className={styles.root}>
      <OAuth2LoginButton
        authorizationUrl={String(new URL('/connect/authorize', settings.apiUrl))}
        icon="user"
        {...buttonProps}
      >
        <FormattedMessage {...messages.loginWith} values={{ name: 'Appsemble' }} />
      </OAuth2LoginButton>
      {settings.logins?.map(({ icon, id, name }) => (
        <OAuth2LoginButton
          key={id}
          authorizationUrl={String(new URL(`/connect/authorize/${id}`, settings.apiUrl))}
          icon={icon}
          {...buttonProps}
        >
          <FormattedMessage {...messages.loginWith} values={{ name }} />
        </OAuth2LoginButton>
      ))}
    </Content>
  );
}
