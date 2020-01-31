import {
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import { useUser } from '../UserProvider';
import styles from './EmailLogin.css';
import messages from './messages';

export default function EmailLogin(): React.ReactElement {
  const { login } = useUser();

  return (
    <SimpleForm
      className={classNames('container', styles.root)}
      defaultValues={{ username: '', password: '' }}
      onSubmit={login}
    >
      <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
      <SimpleInput
        autoComplete="email"
        iconLeft="envelope"
        label={<FormattedMessage {...messages.usernameLabel} />}
        name="username"
        required
        type="email"
      />
      <SimpleInput
        autoComplete="current-password"
        component={PasswordInput}
        label={<FormattedMessage {...messages.passwordLabel} />}
        name="password"
        required
      />
      <SimpleSubmit className="is-pulled-right">
        <FormattedMessage {...messages.loginButton} />
      </SimpleSubmit>
    </SimpleForm>
  );
}
