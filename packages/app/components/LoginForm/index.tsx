import {
  FormButtons,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  useToggle,
} from '@appsemble/preact-components';
import { emailPattern } from '@appsemble/utils';
import { type VNode } from 'preact';
import { useCallback } from 'preact/hooks';
import { Link } from 'wouter-preact';
import { useLocationProperty } from 'wouter-preact/use-browser-location';

import styles from './index.module.css';
import { messages } from './messages.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { PasswordField } from '../PasswordField/index.js';

export interface LoginFormValues {
  email: string;
  password: string;
}

interface LoginFormProps {
  readonly enableRegistration: boolean;
  readonly onPasswordLogin: (credentials: LoginFormValues) => Promise<void>;
  readonly registerLink: string;
  readonly resetPasswordLink: string;
}

export function LoginForm({
  enableRegistration,
  onPasswordLogin,
  registerLink,
  resetPasswordLink,
}: LoginFormProps): VNode {
  const busy = useToggle();
  const locationSuffix = useLocationProperty(
    () => `${window.location.search}${window.location.hash}`,
  );

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
            <Link className="is-block" to={`${registerLink}${locationSuffix}`}>
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
