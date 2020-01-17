import {
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import { Authentication } from '@appsemble/types';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './EmailLogin.css';
import messages from './messages';

interface EmailLoginValues {
  username: string;
  password: string;
}

interface EmailLoginProps {
  authentication: Authentication;
  passwordLogin: (
    url: string,
    values: EmailLoginValues,
    refreshURL: string,
    clientId: string,
    scope: string | string[],
  ) => void;
}

export default function EmailLogin({
  authentication,
  passwordLogin,
}: EmailLoginProps): React.ReactElement {
  const submit = React.useCallback(
    (values: EmailLoginValues) =>
      passwordLogin(
        authentication.url,
        values,
        authentication.refreshURL,
        authentication.clientId,
        authentication.scope,
      ),
    [authentication, passwordLogin],
  );

  return (
    <SimpleForm
      className={classNames('container', styles.root)}
      defaultValues={{ username: '', password: '' }}
      onSubmit={submit}
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
