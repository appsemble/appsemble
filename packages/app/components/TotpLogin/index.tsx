import {
  Button,
  FormButtons,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Title,
} from '@appsemble/react-components';
import { type ReactNode, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { messages } from './messages.js';

interface TotpLoginProps {
  readonly onVerify: (token: string) => Promise<void>;
  readonly onCancel: () => void;
}

export function TotpLogin({ onCancel, onVerify }: TotpLoginProps): ReactNode {
  const { formatMessage } = useIntl();

  const handleSubmit = useCallback(
    async (values: { token: string }) => {
      await onVerify(values.token);
    },
    [onVerify],
  );

  return (
    <div className="box">
      <Title size={4}>
        <FormattedMessage {...messages.title} />
      </Title>
      <p className="mb-4">
        <FormattedMessage {...messages.description} />
      </p>
      <SimpleForm defaultValues={{ token: '' }} onSubmit={handleSubmit}>
        <SimpleFormError>{() => <FormattedMessage {...messages.error} />}</SimpleFormError>
        <SimpleFormField
          autoComplete="one-time-code"
          icon="key"
          inputMode="numeric"
          label={<FormattedMessage {...messages.verifyCode} />}
          maxLength={6}
          minLength={6}
          name="token"
          pattern="[0-9]{6}"
          placeholder={formatMessage(messages.verifyCodePlaceholder)}
          required
        />
        <FormButtons>
          <Button onClick={onCancel}>
            <FormattedMessage {...messages.cancelButton} />
          </Button>
          <SimpleSubmit>
            <FormattedMessage {...messages.verifyButton} />
          </SimpleSubmit>
        </FormButtons>
      </SimpleForm>
    </div>
  );
}
