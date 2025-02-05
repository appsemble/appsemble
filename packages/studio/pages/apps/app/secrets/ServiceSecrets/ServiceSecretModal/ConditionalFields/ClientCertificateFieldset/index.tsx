import { SimpleFormField, TextAreaField } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { messages } from './messages.js';

const certPlaceholder = `-----BEGIN CERTIFICATE-----

-----END CERTIFICATE-----`;
const keyPlaceholder = `-----BEGIN PRIVATE KEY-----

-----END PRIVATE KEY-----`;

interface ClientCertificateFieldsetProps {
  readonly disabled: boolean;
}

export function ClientCertificateFieldset({ disabled }: ClientCertificateFieldsetProps): ReactNode {
  return (
    <>
      <SimpleFormField
        component={TextAreaField}
        disabled={disabled}
        help={<FormattedMessage {...messages.certificateHelp} />}
        label={<FormattedMessage {...messages.certificateLabel} />}
        name="identifier"
        placeholder={certPlaceholder}
        required
      />
      <SimpleFormField
        component={TextAreaField}
        disabled={disabled}
        help={<FormattedMessage {...messages.privateKeyHelp} />}
        label={<FormattedMessage {...messages.privateKeyLabel} />}
        name="secret"
        placeholder={keyPlaceholder}
        required
      />
      <SimpleFormField
        component={TextAreaField}
        disabled={disabled}
        help={<FormattedMessage {...messages.caHelp} />}
        label={<FormattedMessage {...messages.caLabel} />}
        name="ca"
        placeholder={keyPlaceholder}
      />
    </>
  );
}
