import {
  FormButtons,
  Message,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/preact-components';
import { type VNode } from 'preact';
import { useCallback, useState } from 'preact/hooks';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import { BreachedPasswordSimpleFormError } from '../BreachedPasswordSimpleFormError/index.js';
import { PasswordField } from '../PasswordField/index.js';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator/index.js';

export interface EditPasswordValues {
  password: string;
}

interface EditPasswordFormProps {
  readonly onSubmit: (values: EditPasswordValues) => Promise<void>;
}

export function EditPasswordForm({ onSubmit }: EditPasswordFormProps): VNode {
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
      <BreachedPasswordSimpleFormError>
        {() => <FormattedMessage {...messages.requestFailed} />}
      </BreachedPasswordSimpleFormError>
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
