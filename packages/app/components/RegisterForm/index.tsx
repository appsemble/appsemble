import {
  CheckboxField,
  FormButtons,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
} from '@appsemble/preact-components';
import { emailPattern } from '@appsemble/utils';
import axios from 'axios';
import { type VNode } from 'preact';

import { messages } from './messages.js';
import { BreachedPasswordSimpleFormError } from '../BreachedPasswordSimpleFormError/index.js';
import { FormattedMessage } from '../IntlProvider/index.js';
import { PasswordField } from '../PasswordField/index.js';
import { PasswordStrengthIndicator } from '../PasswordStrengthIndicator/index.js';

export interface RegistrationFormValues {
  email: string;
  name: string;
  phoneNumber?: string;
  password: string;
  subscribed: boolean;
}

interface RegisterFormProps {
  readonly onRegister: (values: RegistrationFormValues) => Promise<void>;
  readonly phoneNumberDefinition?: {
    enable: boolean;
    required?: boolean;
  };
}

export function RegisterForm({ onRegister, phoneNumberDefinition }: RegisterFormProps): VNode {
  return (
    <SimpleForm
      defaultValues={{ email: '', name: '', password: '', subscribed: false }}
      onSubmit={onRegister}
    >
      <BreachedPasswordSimpleFormError>
        {({ error }) =>
          axios.isAxiosError(error) && error.response?.status === 409 ? (
            <FormattedMessage {...messages.emailConflict} />
          ) : (
            <FormattedMessage {...messages.registerFailed} />
          )
        }
      </BreachedPasswordSimpleFormError>
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
        pattern={emailPattern}
        required
        type="email"
        validityMessages={{
          typeMismatch: <FormattedMessage {...messages.emailInvalid} />,
          patternMismatch: <FormattedMessage {...messages.emailInvalid} />,
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
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
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
