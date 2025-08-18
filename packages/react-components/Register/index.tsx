import axios from 'axios';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';
import {
  CheckboxField,
  FormButtons,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
} from '../index.js';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator/index.js';

export interface RegistrationFormValues {
  email: string;
  name: string;
  phoneNumber?: string;
  password: string;
  subscribed: boolean;
}

interface RegisterProps {
  readonly onRegister: (values: RegistrationFormValues) => Promise<void>;
  readonly phoneNumberDefinition?: {
    enable: boolean;
    required?: boolean;
  };
}

export function Register({ onRegister, phoneNumberDefinition }: RegisterProps): ReactNode {
  return (
    <SimpleForm
      defaultValues={{ email: '', name: '', password: '', subscribed: false }}
      onSubmit={onRegister}
    >
      <SimpleFormError>
        {({ error }) =>
          axios.isAxiosError(error) && error.response?.status === 409 ? (
            <FormattedMessage {...messages.emailConflict} />
          ) : (
            <FormattedMessage {...messages.registerFailed} />
          )
        }
      </SimpleFormError>
      <SimpleFormField
        autoComplete="name"
        help={<FormattedMessage {...messages.nameHelp} />}
        icon="user"
        label={<FormattedMessage {...messages.nameLabel} />}
        name="name"
      />
      <SimpleFormField
        autoComplete="email"
        icon="envelope"
        label={<FormattedMessage {...messages.emailLabel} />}
        name="email"
        required
        type="email"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
          valueMissing: <FormattedMessage {...messages.emailRequired} />,
        }}
      />
      <SimpleFormField
        autoComplete="new-password"
        component={PasswordField}
        help={<PasswordStrengthIndicator minLength={8} name="password" />}
        label={<FormattedMessage {...messages.passwordLabel} />}
        minLength={8}
        name="password"
        required
      />
      {phoneNumberDefinition?.enable ? (
        <SimpleFormField
          autoComplete="tel"
          icon="mobile"
          label={<FormattedMessage {...messages.phoneNumber} />}
          name="phoneNumber"
          required={Boolean(phoneNumberDefinition?.required)}
          type="tel"
        />
      ) : null}
      <SimpleFormField
        // eslint-disable-next-line @typescript-eslint/prefer-ts-expect-error
        // @ts-ignore Messed up
        component={CheckboxField}
        name="subscribed"
        title={<FormattedMessage {...messages.newsletter} />}
      />
      <FormButtons>
        <SimpleSubmit className="is-pulled-right">
          <FormattedMessage {...messages.registerButton} />
        </SimpleSubmit>
      </FormButtons>
    </SimpleForm>
  );
}
