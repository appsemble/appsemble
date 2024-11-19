import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface ClientCredentialsFieldsetProps {
  readonly disabled: boolean;
}

export function ClientCredentialsFieldset({ disabled }: ClientCredentialsFieldsetProps): ReactNode {
  return (
    <>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.clientIdHelp} />}
        label={<FormattedMessage {...messages.clientIdLabel} />}
        name="identifier"
        required
      />
      <SimpleFormField
        autoComplete="new-password"
        component={PasswordField}
        disabled={disabled}
        help={<FormattedMessage {...messages.clientSecretHelp} />}
        label={<FormattedMessage {...messages.clientSecretLabel} />}
        name="secret"
        required
      />
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.tokenUrlHelp} />}
        label={<FormattedMessage {...messages.tokenUrlLabel} />}
        name="tokenUrl"
        placeholder="https://example.com/oauth/token"
        required
      />
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.scopeHelp} />}
        label={<FormattedMessage {...messages.scopeLabel} />}
        name="scope"
        placeholder="https://example.com/.default"
      />
    </>
  );
}
