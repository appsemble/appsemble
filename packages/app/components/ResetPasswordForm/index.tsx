import {
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/preact-components';
import { emailPattern } from '@appsemble/utils';
import { type VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';

import { messages } from './messages.js';
import { FormattedMessage } from '../IntlProvider/index.js';

export interface ResetPasswordValues {
  email: string;
}

interface ResetPasswordFormProps {
  readonly onSubmit: (email: string) => Promise<void>;
}

export function ResetPasswordForm({ onSubmit }: ResetPasswordFormProps): VNode {
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
