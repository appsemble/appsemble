import { PasswordField, SimpleFormField } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

interface QueryParameterFieldsetProps {
  readonly disabled: boolean;
}

export function QueryParameterFieldset({ disabled }: QueryParameterFieldsetProps): ReactElement {
  return (
    <>
      <SimpleFormField
        disabled={disabled}
        help={<FormattedMessage {...messages.queryHelp} />}
        label={<FormattedMessage {...messages.queryLabel} />}
        name="identifier"
        placeholder="api_key"
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
