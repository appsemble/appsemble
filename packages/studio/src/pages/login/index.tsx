import {
  Content,
  FormButtons,
  OAuth2LoginButton,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useMeta,
  useQuery,
  useToggle,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation, useParams } from 'react-router-dom';

import { useUser } from '../../components/UserProvider';
import { enableRegistration, logins } from '../../utils/settings';
import styles from './index.module.css';
import { messages } from './messages';

interface LoginFormValues {
  email: string;
  password: string;
}

export function LoginPage(): ReactElement {
  useMeta(messages.title, messages.description);
  const location = useLocation();
  const { login } = useUser();
  const qs = useQuery();
  const busy = useToggle();
  const { lang } = useParams<{ lang: string }>();

  const onPasswordLogin = useCallback(
    async ({ email, password }: LoginFormValues) => {
      busy.enable();
      try {
        const { data } = await axios.post('/api/login', undefined, {
          headers: { authorization: `Basic ${btoa(`${email}:${password}`)}` },
        });
        login(data);
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
    },
    [busy, login],
  );

  return (
    <Content>
      <SimpleForm defaultValues={{ email: '', password: '' }} onSubmit={onPasswordLogin}>
        <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
        <SimpleFormField
          autoComplete="email"
          disabled={busy.enabled}
          icon="envelope"
          label={<FormattedMessage {...messages.emailLabel} />}
          name="email"
          required
          type="email"
          validityMessages={{
            typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
            valueMissing: <FormattedMessage {...messages.emailRequired} />,
          }}
        />
        <SimpleFormField
          autoComplete="current-password"
          component={PasswordField}
          disabled={busy.enabled}
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          required
          validityMessages={{
            valueMissing: <FormattedMessage {...messages.passwordRequired} />,
          }}
        />
        <FormButtons>
          {enableRegistration && (
            <div>
              <Link
                className="is-block"
                to={{ pathname: `/${lang}/register`, search: location.search, hash: location.hash }}
              >
                <FormattedMessage {...messages.registerLink} />
              </Link>
              <Link className="is-block" to={`/${lang}/reset-password`}>
                <FormattedMessage {...messages.forgotPasswordLink} />
              </Link>
            </div>
          )}
          <SimpleSubmit disabled={busy.enabled}>
            <FormattedMessage {...messages.loginButton} />
          </SimpleSubmit>
        </FormButtons>
      </SimpleForm>
      <div className={`${styles.socialLogins} mt-5`}>
        {logins.map((provider) => (
          <OAuth2LoginButton
            authorizationUrl={provider.authorizationUrl}
            className="mr-2"
            clientId={provider.clientId}
            disabled={busy.enabled}
            icon={provider.icon}
            key={provider.authorizationUrl}
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
