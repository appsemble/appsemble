import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation, useParams } from 'react-router-dom';

import {
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useToggle,
} from '..';
import { messages } from './messages';

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginProps {
  enableRegistration: boolean;
  onPasswordLogin: (credentials: LoginFormValues) => Promise<void>;
}

export function Login({ enableRegistration, onPasswordLogin }: LoginProps): ReactElement {
  const busy = useToggle();
  const { lang } = useParams<{ lang: string }>();
  const location = useLocation();

  const handleLogin = useCallback(
    async (credentials: LoginFormValues) => {
      busy.enable();

      try {
        await onPasswordLogin(credentials);
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
    },
    [busy, onPasswordLogin],
  );

  return (
    <SimpleForm defaultValues={{ email: '', password: '' }} onSubmit={handleLogin}>
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
        <div>
          {enableRegistration && (
            <Link
              className="is-block"
              to={{ pathname: `/${lang}/register`, search: location.search, hash: location.hash }}
            >
              <FormattedMessage {...messages.registerLink} />
            </Link>
          )}
          <Link className="is-block" to={`/${lang}/reset-password`}>
            <FormattedMessage {...messages.forgotPasswordLink} />
          </Link>
        </div>
        <SimpleSubmit disabled={busy.enabled}>
          <FormattedMessage {...messages.loginButton} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
