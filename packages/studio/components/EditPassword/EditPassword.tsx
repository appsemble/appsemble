import {
  Message,
  PasswordInput,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
  useQuery,
} from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import styles from './EditPassword.css';
import messages from './messages';

export default function EditPassword(): React.ReactElement {
  const qs = useQuery();
  const [success, setSuccess] = React.useState(false);
  const token = qs.get('token');
  const submit = React.useCallback(
    async ({ password }) => {
      await axios.post('/api/email/reset', { token, password });
      setSuccess(true);
    },
    [token],
  );

  if (!token) {
    return <Redirect to="/apps" />;
  }

  return (
    <>
      <HelmetIntl title={messages.title} />
      {success ? (
        <div className={classNames('container', styles.root)}>
          <Message color="success">
            <FormattedMessage {...messages.requestSuccess} />
          </Message>
        </div>
      ) : (
        <SimpleForm className={styles.root} defaultValues={{ password: '' }} onSubmit={submit}>
          <SimpleFormError>
            {() => <FormattedMessage {...messages.requestFailed} />}
          </SimpleFormError>
          <SimpleInput
            autoComplete="new-password"
            component={PasswordInput}
            label={<FormattedMessage {...messages.passwordLabel} />}
            name="password"
            required
            validityMessages={{
              valueMissing: <FormattedMessage {...messages.passwordRequired} />,
            }}
          />
          <SimpleSubmit className="is-pulled-right">
            <FormattedMessage {...messages.requestButton} />
          </SimpleSubmit>
        </SimpleForm>
      )}
    </>
  );
}
