import { Content, OAuth2LoginButton, useQuery, useToggle } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import settings from '../../utils/settings';
import styles from './index.css';
import messages from './messages';

export default function OpenIDLogin(): React.ReactElement {
  const qs = useQuery();
  const busy = useToggle();

  return (
    <Content className={styles.root}>
      <OAuth2LoginButton
        authorizationUrl={String(new URL('/connect/authorize', settings.apiUrl))}
        clientId={`app:${settings.id}`}
        disabled={busy.enabled}
        icon="user"
        onClick={busy.enable}
        redirect={qs.get('redirect')}
        redirectUrl="/Callback"
        scope="email openid profile resources:manage"
      >
        <FormattedMessage {...messages.loginWith} values={{ name: 'Appsemble' }} />
      </OAuth2LoginButton>
    </Content>
  );
}
