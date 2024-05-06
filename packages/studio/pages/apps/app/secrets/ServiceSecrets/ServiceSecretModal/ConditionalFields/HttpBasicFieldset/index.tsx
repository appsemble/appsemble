import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface HttpBasicFieldsetProps {
  readonly disabled: boolean;
}

export function HttpBasicFieldset({ disabled }: HttpBasicFieldsetProps): ReactNode {
  return (
    <>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.usernameHelp} />}
        label={<FormattedMessage {...messages.usernameLabel} />}
        name="identifier"
        required
      />
      <SimpleFormField
        autoComplete="new-password"
        component={PasswordField}
        disabled={disabled}
        help={<FormattedMessage {...messages.passwordHelp} />}
        label={<FormattedMessage {...messages.passwordLabel} />}
        name="secret"
        required
      />
    </>
  );
}
