import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import {
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '../index.js';
import { emailPattern } from '@appsemble/utils';

export interface ResetPasswordValues {
  email: string;
}

interface ResetPasswordProps {
  readonly onSubmit: (email: string) => Promise<void>;
}

export function ResetPassword({ onSubmit }: ResetPasswordProps): ReactNode {
  const [success, setSuccess] = useState(false);

  const submit = useCallback(
    async ({ email }: ResetPasswordValues): Promise<void> => {
      await onSubmit(email);
      setSuccess(true);
    },
    [onSubmit],
  );

  return success ? (
    <Message color="success">
      <FormattedMessage {...messages.requestSuccess} />
    </Message>
  ) : (
    <SimpleForm defaultValues={{ email: '' }} onSubmit={submit} resetOnSuccess>
      <SimpleFormError>{() => <FormattedMessage {...messages.requestFailed} />}</SimpleFormError>
      <SimpleFormField
        autoComplete="email"
        icon="envelope"
        label={<FormattedMessage {...messages.emailLabel} />}
        name="email"
        pattern={emailPattern}
        required
        type="email"
        validityMessages={{
          valueMissing: <FormattedMessage {...messages.emailRequired} />,
          typeMismatch: <FormattedMessage {...messages.emailMissing} />,
          patternMismatch: <FormattedMessage {...messages.emailMissing} />,
        }}
      />
      <FormButtons>
        <SimpleSubmit className="is-pulled-right">
          <FormattedMessage {...messages.requestButton} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
