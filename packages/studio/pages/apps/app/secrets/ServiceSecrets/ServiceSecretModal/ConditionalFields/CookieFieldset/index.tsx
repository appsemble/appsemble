import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface CookieFieldsetProps {
  disabled: boolean;
}

export function CookieFieldset({ disabled }: CookieFieldsetProps): ReactElement {
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
