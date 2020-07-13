import {
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import classNames from 'classnames';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { useUser } from '../UserProvider';
import styles from './index.css';
import messages from './messages';

export default function EmailLogin(): ReactElement {
  const { passwordLogin } = useUser();

  return (
    <SimpleForm
      className={classNames('container px-3 py-3', styles.root)}
      defaultValues={{ username: '', password: '' }}
      onSubmit={passwordLogin}
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
