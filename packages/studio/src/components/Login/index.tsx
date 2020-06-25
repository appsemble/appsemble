import {
  Content,
  FormButtons,
  OAuth2LoginButton,
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
  useQuery,
  useToggle,
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
  const qs = useQuery();
  const busy = useToggle();

  const onPasswordLogin = React.useCallback(
    async ({ email, password }: LoginFormValues) => {
      busy.enable();
      try {
        const { data } = await axios.post('/api/login', undefined, {
          headers: { authorization: `Basic ${btoa(`${email}:${password}`)}` },
        });
        login(data);
      } catch (error) {
        busy.disable();
        throw error;
      }
    },
    [busy, login],
  );

  return (
    <Content padding>
      <HelmetIntl title={messages.title} />
      <SimpleForm defaultValues={{ email: '', password: '' }} onSubmit={onPasswordLogin}>
        <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
        <SimpleInput
          autoComplete="email"
          disabled={busy.enabled}
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
          disabled={busy.enabled}
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
                className="is-block"
                to={{ pathname: '/register', search: location.search, hash: location.hash }}
              >
                <FormattedMessage {...messages.registerLink} />
              </Link>
            )}
            <Link className="is-block" to="/reset-password">
              <FormattedMessage {...messages.forgotPasswordLink} />
            </Link>
          </div>
          <SimpleSubmit disabled={busy.enabled}>
            <FormattedMessage {...messages.loginButton} />
          </SimpleSubmit>
        </FormButtons>
      </SimpleForm>
      <div className={`${styles.socialLogins} mt-5`}>
        {settings.logins.map((provider) => (
          <OAuth2LoginButton
            key={provider.authorizationUrl}
            authorizationUrl={provider.authorizationUrl}
            className="mr-2"
            clientId={provider.clientId}
            disabled={busy.enabled}
            icon={provider.icon}
            iconPrefix="fab"
            onClick={busy.enable}
            redirect={qs.get('redirect')}
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
