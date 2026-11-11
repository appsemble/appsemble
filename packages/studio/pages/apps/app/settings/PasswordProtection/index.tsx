import {
  CheckboxField,
  PasswordField,
  SimpleFormField,
  TextAreaField,
  useSimpleForm,
} from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { useApp } from '../../index.js';
import { messages } from '../messages.js';

interface PasswordProtectionProps {
  readonly disabled: boolean;
}

export function PasswordProtection({ disabled }: PasswordProtectionProps): ReactNode {
  const { app } = useApp();
  const { values } = useSimpleForm();

  return (
    <>
      <SimpleFormField
        component={CheckboxField}
        disabled={disabled}
        help={
          <FormattedMessage
            {...messages.passwordProtectedDescription}
            values={{
              link: (link) => (
                <Link
                  rel="noopener noreferrer"
                  target="_blank"
                  to="../../../docs/guides/password-protection"
                >
                  {link}
                </Link>
              ),
            }}
          />
        }
        label={<FormattedMessage {...messages.passwordProtectedLabel} />}
        name="passwordProtected"
      />
      {values.passwordProtected ? (
        <>
          <SimpleFormField
            autoComplete="new-password"
            component={PasswordField}
            disabled={disabled}
            help={
              <FormattedMessage
                {...(app.passwordProtected
                  ? messages.passwordChangeDescription
                  : messages.passwordDescription)}
              />
            }
            label={<FormattedMessage {...messages.passwordLabel} />}
            name="password"
            required={!app.passwordProtected}
          />
          <SimpleFormField
            component={TextAreaField}
            disabled={disabled}
            help={<FormattedMessage {...messages.passwordMessageDescription} />}
            label={<FormattedMessage {...messages.passwordMessageLabel} />}
            name="passwordMessage"
          />
        </>
      ) : null}
    </>
  );
}
