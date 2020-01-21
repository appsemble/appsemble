import {
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './ResetPassword.css';

interface FormValues {
  email: string;
}

export default function ResetPassword(): React.ReactElement {
  const [success, setSuccess] = React.useState(false);

  const submit = React.useCallback(async ({ email }: FormValues): Promise<void> => {
    await axios.post('/api/email/reset/request', { email });
    setSuccess(true);
  }, []);

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
        <SimpleForm
          className={`container ${styles.root}`}
          defaultValues={{ email: '' }}
          onSubmit={submit}
          resetOnSuccess
        >
          <SimpleFormError>
            {() => <FormattedMessage {...messages.requestFailed} />}
          </SimpleFormError>
          <SimpleInput
            autoComplete="email"
            iconLeft="envelope"
            label={<FormattedMessage {...messages.emailLabel} />}
            name="email"
            required
            type="email"
            validityMessages={{
              valueMissing: <FormattedMessage {...messages.emailRequired} />,
              typeMismatch: <FormattedMessage {...messages.emailMissing} />,
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
