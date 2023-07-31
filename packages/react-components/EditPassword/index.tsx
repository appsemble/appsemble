import { type ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import {
  FormButtons,
  Message,
  PasswordField,
  PasswordStrengthIndicator,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '../index.js';

export interface EditPasswordValues {
  password: string;
}

interface EditPasswordProps {
  readonly onSubmit: (values: EditPasswordValues) => Promise<void>;
}

export function EditPassword({ onSubmit }: EditPasswordProps): ReactElement {
  const [success, setSuccess] = useState(false);
  const submit = useCallback(
    async (value: EditPasswordValues) => {
      await onSubmit(value);
      setSuccess(true);
    },
    [onSubmit],
  );

  return success ? (
    <Message color="success">
      <FormattedMessage {...messages.requestSuccess} />
    </Message>
  ) : (
    <SimpleForm defaultValues={{ password: '' }} onSubmit={submit}>
      <SimpleFormError>{() => <FormattedMessage {...messages.requestFailed} />}</SimpleFormError>
      <SimpleFormField
        autoComplete="new-password"
        component={PasswordField}
        help={<PasswordStrengthIndicator minLength={8} name="password" />}
        label={<FormattedMessage {...messages.passwordLabel} />}
        name="password"
        required
      />
      <FormButtons>
        <SimpleSubmit className="is-pulled-right">
          <FormattedMessage {...messages.requestButton} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
