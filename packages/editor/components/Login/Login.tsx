import {
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import settings from '../../utils/settings';
import HelmetIntl from '../HelmetIntl';
import SocialLoginButton from '../SocialLoginButton';
import styles from './Login.css';
import messages from './messages';

interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginProps {
  // XXX define type
  passwordLogin: any;
}

const loginMethods = new Set(settings.logins);

export default function Login({ passwordLogin }: LoginProps): React.ReactElement {
  const location = useLocation();
  const onPasswordLogin = React.useCallback(
    ({ email, password }: LoginFormValues) =>
      passwordLogin(
        '/api/oauth/token',
        { username: email, password },
        '/api/oauth/token',
        'appsemble-editor',
        'apps:read apps:write',
      ),
    [passwordLogin],
  );

  const returnUri = new URLSearchParams({ returnUri: '/connect' });

  return (
    <div className={styles.root}>
      <HelmetIntl title={messages.title} />
      <SimpleForm defaultValues={{ email: '', password: '' }} onSubmit={onPasswordLogin}>
        <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
        <SimpleInput
          autoComplete="email"
          iconLeft="envelope"
          label={<FormattedMessage {...messages.emailLabel} />}
          name="email"
          required
          type="email"
        />
        <SimpleInput
          autoComplete="current-password"
          iconLeft="unlock"
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          required
          type="password"
        />
        <div className={styles.loginBottom}>
          <div>
            {settings.enableRegistration && (
              <Link
                className={styles.formLink}
                to={{ pathname: '/register', search: location.search, hash: location.hash }}
              >
                <FormattedMessage {...messages.registerLink} />
              </Link>
            )}
            <Link className={styles.formLink} to="/reset-password">
              <FormattedMessage {...messages.forgotPasswordLink} />
            </Link>
          </div>
          <SimpleSubmit>
            <FormattedMessage {...messages.loginButton} />
          </SimpleSubmit>
        </div>
      </SimpleForm>
      <div className={styles.socialLogins}>
        {loginMethods.has('google') && (
          <SocialLoginButton
            iconClass="google"
            providerUri={`/api/oauth/connect/google?${returnUri}`}
          >
            <FormattedMessage {...messages.login} values={{ provider: 'Google' }} />
          </SocialLoginButton>
        )}
        {loginMethods.has('gitlab') && (
          <SocialLoginButton
            iconClass="gitlab"
            providerUri={`/api/oauth/connect/gitlab?${returnUri}`}
          >
            <FormattedMessage {...messages.login} values={{ provider: 'GitLab' }} />
          </SocialLoginButton>
        )}
      </div>
    </div>
  );
}
