import {
  Content,
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { Main } from '../Main';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export function EmailLogin(): ReactElement {
  const { passwordLogin } = useUser();

  return (
    <Content padding>
      <Main>
        <SimpleForm defaultValues={{ username: '', password: '' }} onSubmit={passwordLogin}>
          <SimpleFormError>{() => <FormattedMessage {...messages.loginFailed} />}</SimpleFormError>
          <SimpleFormField
            autoComplete="email"
            icon="envelope"
            label={<FormattedMessage {...messages.usernameLabel} />}
            name="username"
            required
            type="email"
          />
          <SimpleFormField
            autoComplete="current-password"
            component={PasswordField}
            label={<FormattedMessage {...messages.passwordLabel} />}
            name="password"
            required
          />
          <FormButtons>
            <SimpleSubmit>
              <FormattedMessage {...messages.loginButton} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </Main>
    </Content>
  );
}
