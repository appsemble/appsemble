import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface CookieFieldsetProps {
  readonly disabled: boolean;
}

export function CookieFieldset({ disabled }: CookieFieldsetProps): ReactNode {
  return (
    <>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.cookieHelp} />}
        label={<FormattedMessage {...messages.cookieLabel} />}
        name="identifier"
        placeholder="secret-name"
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
