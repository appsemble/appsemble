import { type ReactNode, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useLocation } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import {
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useToggle,
} from '../index.js';
import { emailPattern } from '@appsemble/utils';

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginProps {
  readonly enableRegistration: boolean;
  readonly onPasswordLogin: (credentials: LoginFormValues) => Promise<void>;
  readonly registerLink: string;
  readonly resetPasswordLink: string;
}

export function Login({
  enableRegistration,
  onPasswordLogin,
  registerLink,
  resetPasswordLink,
}: LoginProps): ReactNode {
  const busy = useToggle();
  const location = useLocation();

  const handleLogin = useCallback(
    async (credentials: LoginFormValues) => {
      busy.enable();

      try {
        await onPasswordLogin(credentials);
        busy.disable();
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
    },
    [busy, onPasswordLogin],
  );

  return (
    <SimpleForm
      className={styles.root}
      defaultValues={{ email: '', password: '' }}
      onSubmit={handleLogin}
    >
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      <SimpleFormField
        autoComplete="email"
        data-testid="email"
        disabled={busy.enabled}
        icon="envelope"
        label={<FormattedMessage {...messages.emailLabel} />}
        name="email"
        pattern={emailPattern}
        required
        type="email"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
          patternMismatch: <FormattedMessage {...messages.emailInvalid} />,
          valueMissing: <FormattedMessage {...messages.emailRequired} />,
        }}
      />
      <SimpleFormField
        autoComplete="current-password"
        component={PasswordField}
        data-testid="password"
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
          {enableRegistration ? (
            <Link
              className="is-block"
              to={{ pathname: registerLink, search: location.search, hash: location.hash }}
            >
              <FormattedMessage {...messages.registerLink} />
            </Link>
          ) : null}
          <Link className="is-block" to={resetPasswordLink}>
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
