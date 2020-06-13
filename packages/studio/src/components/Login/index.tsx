import {
  Content,
  FormButtons,
  OAuth2LoginButton,
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import useUser from '../../hooks/useUser';
import settings from '../../utils/settings';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function Login(): React.ReactElement {
  const location = useLocation();
  const { login } = useUser();
  const onPasswordLogin = React.useCallback(
    async ({ email, password }: LoginFormValues) => {
      const { data } = await axios.post('/api/login', undefined, {
        headers: { authorization: `Basic ${btoa(`${email}:${password}`)}` },
      });
      login(data);
    },
    [login],
  );

  return (
    <Content padding>
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
          validityMessages={{
            typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
            valueMissing: <FormattedMessage {...messages.emailRequired} />,
          }}
        />
        <SimpleInput
          autoComplete="current-password"
          component={PasswordInput}
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          required
          validityMessages={{
            valueMissing: <FormattedMessage {...messages.passwordRequired} />,
          }}
        />
        <FormButtons>
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
        </FormButtons>
      </SimpleForm>
      <div className={styles.socialLogins}>
        {settings.logins.map((provider) => (
          <OAuth2LoginButton
            key={provider.authorizationUrl}
            authorizationUrl={provider.authorizationUrl}
            className={styles.button}
            clientId={provider.clientId}
            icon={provider.icon}
            iconPrefix="fab"
            redirectUrl="/callback"
            scope={provider.scope}
          >
            <FormattedMessage {...messages.loginWith} values={{ name: provider.name }} />
          </OAuth2LoginButton>
        ))}
      </div>
    </Content>
  );
}
