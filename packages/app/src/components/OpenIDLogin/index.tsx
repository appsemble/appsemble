import { Content, OAuth2LoginButton } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import settings from '../../utils/settings';
import styles from './index.css';
import messages from './messages';

export default function OpenIDLogin(): React.ReactElement {
  return (
    <Content className={styles.root}>
      <OAuth2LoginButton
        authorizationUrl={String(new URL('/connect/authorize', settings.apiUrl))}
        clientId={`app:${settings.id}`}
        icon="user"
        redirectUrl="/Callback"
        scope="openid"
      >
        <FormattedMessage {...messages.loginWith} values={{ name: 'Appsemble' }} />
      </OAuth2LoginButton>
    </Content>
  );
}
