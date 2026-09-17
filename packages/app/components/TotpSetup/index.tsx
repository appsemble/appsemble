import {
  Button,
  FormButtons,
  FormOutput,
  Message,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { QRCodeSVG } from 'qrcode.react';

import { messages } from './messages.js';
import { apiUrl, appId } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

interface SetupResponse {
  secret: string;
  otpauthUrl: string;
}

/**
 * The tokens returned when enrollment completes a pending login.
 */
export interface TotpSetupTokenResponse {
  access_token: string;
  refresh_token?: string;
}

interface TotpSetupProps {
  /**
   * Called when TOTP setup is complete.
   *
   * Receives the tokens completing the login when enrollment was part of a login flow, or `null`
   * when the app member was already logged in.
   */
  readonly onComplete: (tokens: TotpSetupTokenResponse | null) => Promise<void>;
  readonly onCancel: () => void;
  readonly isRequired?: boolean;

  /**
   * The pending TOTP token from the first login step.
   *
   * Used when the app member is in the login flow and hasn’t fully authenticated yet.
   */
  readonly totpToken?: string;
}

export function TotpSetup({
  isRequired = false,
  onCancel,
  onComplete,
  totpToken,
}: TotpSetupProps): ReactNode {
  const { formatMessage } = useIntl();
  const { appMemberInfo, setAppMemberInfo } = useAppMember();
  const push = useMessages();
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startSetup = async (): Promise<void> => {
      try {
        const { data } = await axios.post<SetupResponse>(
          `${apiUrl}/api/apps/${appId}/auth/totp/setup`,
          totpToken ? { totpToken } : undefined,
        );
        setSetupData(data);
        setIsLoading(false);
      } catch {
        setError(formatMessage(messages.setupError));
        setIsLoading(false);
      }
    };

    startSetup();
  }, [formatMessage, totpToken]);

  const onVerifySetup = useCallback(
    async (values: { token: string }) => {
      let tokens: TotpSetupTokenResponse | null = null;
      try {
        // On the login flow this completes the login and returns tokens, so the code doesn’t have
        // to be submitted a second time.
        const { data, status } = await axios.post<TotpSetupTokenResponse | ''>(
          `${apiUrl}/api/apps/${appId}/auth/totp/verify-setup`,
          {
            token: values.token,
            ...(totpToken ? { totpToken } : {}),
          },
        );
        tokens = status === 200 && data ? data : null;
        // Only update appMemberInfo if the user is already logged in
        if (appMemberInfo) {
          setAppMemberInfo({
            ...appMemberInfo,
            totpEnabled: true,
          });
        }
      } catch {
        push({ body: formatMessage(messages.invalidCode), color: 'danger' });
        throw new Error(formatMessage(messages.invalidCode));
      }
      await onComplete(tokens);
      push({ body: formatMessage(messages.setupSuccess), color: 'success' });
    },
    [appMemberInfo, formatMessage, onComplete, push, setAppMemberInfo, totpToken],
  );

  if (isLoading) {
    return (
      <div className="box">
        <Title size={4}>
          <FormattedMessage {...messages.title} />
        </Title>
        <p>
          <FormattedMessage {...messages.loading} />
        </p>
      </div>
    );
  }

  if (error || !setupData) {
    return (
      <div className="box">
        <Title size={4}>
          <FormattedMessage {...messages.title} />
        </Title>
        <Message color="danger">{error || formatMessage(messages.setupError)}</Message>
        {isRequired ? null : (
          <Button onClick={onCancel}>
            <FormattedMessage {...messages.cancelButton} />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="box">
      <Title size={4}>
        <FormattedMessage {...messages.title} />
      </Title>
      {isRequired ? (
        <Message color="warning">
          <FormattedMessage {...messages.requiredNotice} />
        </Message>
      ) : null}
      <p className="mb-4">
        <FormattedMessage {...messages.description} />
      </p>
      <div className="has-text-centered mb-4">
        <QRCodeSVG size={200} value={setupData.otpauthUrl} />
      </div>
      <FormOutput
        copyErrorMessage={formatMessage(messages.copyError)}
        copySuccessMessage={formatMessage(messages.copiedToClipboard)}
        label={<FormattedMessage {...messages.secretKey} />}
        name="secret"
        value={setupData.secret}
      />
      <SimpleForm defaultValues={{ token: '' }} onSubmit={onVerifySetup}>
        <SimpleFormError>{() => <FormattedMessage {...messages.verifyError} />}</SimpleFormError>
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
          {isRequired ? null : (
            <Button onClick={onCancel}>
              <FormattedMessage {...messages.cancelButton} />
            </Button>
          )}
          <SimpleSubmit>
            <FormattedMessage {...messages.verifyButton} />
          </SimpleSubmit>
        </FormButtons>
      </SimpleForm>
    </div>
  );
}
