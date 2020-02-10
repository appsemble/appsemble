import { Button, Loader, Message, useQuery } from '@appsemble/react-components';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import redirectOAuth2 from '../../utils/redirectOAuth2';
import { useUser } from '../UserProvider';
import messages from './messages';
import styles from './OpenIDCallback.css';

export default function OpenIDCallback(): React.ReactElement {
  const { redirect } = localStorage;
  const query = useQuery();
  const code = query.get('code');
  const { authorizationCodeLogin, isLoggedIn } = useUser();

  const [error, setError] = React.useState(false);

  const retry = React.useCallback(() => {
    redirectOAuth2(redirect);
  }, [redirect]);

  React.useEffect(() => {
    if (code) {
      const url = new URL(`${window.location}`);
      url.searchParams.delete('code');
      authorizationCodeLogin({ code, redirect_uri: `${url}` }).catch(() => {
        setError(true);
      });
    }
  }, [authorizationCodeLogin, code]);

  if (!code) {
    return <FormattedMessage {...messages.invalidCallback} />;
  }

  if (isLoggedIn) {
    return <Redirect to={redirect} />;
  }

  if (error) {
    return (
      <div className={styles.error}>
        <Message color="danger">
          <FormattedMessage {...messages.error} />
        </Message>
        <Button color="primary" onClick={retry}>
          <FormattedMessage {...messages.retry} />
        </Button>
      </div>
    );
  }

  return <Loader />;
}
