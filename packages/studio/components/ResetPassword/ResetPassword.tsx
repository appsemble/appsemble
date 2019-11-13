import {
  SimpleForm,
  SimpleFormError,
  SimpleInput,
  SimpleSubmit,
} from '@appsemble/react-components';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './ResetPassword.css';

export interface ResetPasswordProps {
  // XXX ReturnType<actions.user.requestResetPassword>
  requestResetPassword: (email: string) => Promise<void>;
}

interface FormValues {
  email: string;
}

export default function ResetPassword({
  requestResetPassword,
}: ResetPasswordProps): React.ReactElement {
  const [success, setSuccess] = React.useState(false);

  const submit = React.useCallback(
    async ({ email }: FormValues): Promise<void> => {
      await requestResetPassword(email);
      setSuccess(true);
    },
    [requestResetPassword],
  );

  return (
    <>
      <HelmetIntl title={messages.title} />
      {success ? (
        <div className={classNames('container', styles.root)}>
          <article className="message is-success">
            <div className="message-body">
              <FormattedMessage {...messages.requestSuccess} />
            </div>
          </article>
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
