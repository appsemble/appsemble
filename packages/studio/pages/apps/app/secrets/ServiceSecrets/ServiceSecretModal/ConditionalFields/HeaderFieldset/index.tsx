import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface HeaderFieldsetProps {
  readonly disabled: boolean;
}

export function HeaderFieldset({ disabled }: HeaderFieldsetProps): ReactNode {
  return (
    <>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.headerHelp} />}
        label={<FormattedMessage {...messages.headerLabel} />}
        name="identifier"
        placeholder="x-api-key"
        required
      />
      <SimpleFormField
        autoComplete="new-password"
        component={PasswordField}
        disabled={disabled}
        help={<FormattedMessage {...messages.secretHelp} />}
        label={<FormattedMessage {...messages.secretLabel} />}
        name="secret"
        required
      />
    </>
  );
}
