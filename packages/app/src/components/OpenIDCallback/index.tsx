import { Loader, Message, OAuth2LoginButton, useQuery } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import settings from '../../utils/settings';
import { useAppDefinition } from '../AppDefinitionProvider';
import { useUser } from '../UserProvider';
import styles from './index.css';
import messages from './messages';

export default function OpenIDCallback(): React.ReactElement {
  const { redirect } = localStorage;
  const query = useQuery();
  const code = query.get('code');
  const { authorizationCodeLogin, isLoggedIn } = useUser();
  const { definition } = useAppDefinition();

  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    if (code) {
      authorizationCodeLogin({
        code,
        redirect_uri: `${window.location.origin}${window.location.pathname}`,
      }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code]);

  if (!code) {
    return <FormattedMessage {...messages.invalidCallback} />;
  }

  if (isLoggedIn) {
    return <Redirect to={redirect || normalize(definition.defaultPage)} />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Message color="danger">
          <FormattedMessage {...messages.error} />
        </Message>
        <OAuth2LoginButton
          authorizationUrl={String(new URL('/connect/authorize', settings.apiUrl))}
          clientId={`app:${settings.id}`}
          icon="user"
          redirectUrl="/Callback"
          scope="openid"
        >
          <FormattedMessage {...messages.retry} />
        </OAuth2LoginButton>
      </div>
    );
  }

  return <Loader />;
}
