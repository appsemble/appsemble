import {
  Button,
  FormButtons,
  FormOutput,
  Icon,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useMessages,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { QRCodeSVG } from 'qrcode.react';

import { messages } from './messages.js';
import { apiUrl, appId, demoMode, totp as totpSetting } from '../../utils/settings.js';
import { useAppMember } from '../AppMemberProvider/index.js';

interface SetupResponse {
  secret: string;
  otpauthUrl: string;
}

export function TotpSettings(): ReactNode {
  const { formatMessage } = useIntl();
  const { appMemberInfo, setAppMemberInfo } = useAppMember();
  const push = useMessages();
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [setupData, setSetupData] = useState<SetupResponse | null>(null);

  const totpEnabled = appMemberInfo?.totpEnabled ?? false;
  const isRequired = totpSetting === 'required';

  const onStartSetup = useCallback(async () => {
    try {
      const { data } = await axios.post<SetupResponse>(
        `${apiUrl}/api/apps/${appId}/auth/totp/setup`,
      );
      setSetupData(data);
      setIsSettingUp(true);
    } catch {
      push({ body: formatMessage(messages.enableError), color: 'danger' });
    }
  }, [formatMessage, push]);

  const onCancelSetup = useCallback(() => {
    setIsSettingUp(false);
    setSetupData(null);
  }, []);

  const onVerifySetup = useCallback(
    async (values: { token: string }) => {
      try {
        await axios.post(`${apiUrl}/api/apps/${appId}/auth/totp/verify-setup`, {
          token: values.token,
        });
        setAppMemberInfo({
          ...appMemberInfo,
          totpEnabled: true,
        });
        setIsSettingUp(false);
        setSetupData(null);
        push({ body: formatMessage(messages.enableSuccess), color: 'success' });
      } catch {
        push({ body: formatMessage(messages.invalidCode), color: 'danger' });
        throw new Error(formatMessage(messages.invalidCode));
      }
    },
    [appMemberInfo, formatMessage, push, setAppMemberInfo],
  );

  const onStartDisable = useCallback(() => {
    setIsDisabling(true);
  }, []);

  const onCancelDisable = useCallback(() => {
    setIsDisabling(false);
  }, []);

  const onDisable = useCallback(
    async (values: { token: string }) => {
      try {
        await axios.post(`${apiUrl}/api/apps/${appId}/auth/totp/disable`, {
          token: values.token,
        });
        setAppMemberInfo({
          ...appMemberInfo,
          totpEnabled: false,
        });
        setIsDisabling(false);
        push({ body: formatMessage(messages.disableSuccess), color: 'success' });
      } catch {
        push({ body: formatMessage(messages.invalidCode), color: 'danger' });
        throw new Error(formatMessage(messages.invalidCode));
      }
    },
    [appMemberInfo, formatMessage, push, setAppMemberInfo],
  );

  // Don't show TOTP settings if it's disabled at app level or if demo mode is enabled
  if (totpSetting === 'disabled' || demoMode) {
    return null;
  }

  // Setup flow
  if (isSettingUp && setupData) {
    return (
      <section className="mb-5">
        <Title size={4}>
          <FormattedMessage {...messages.setupTitle} />
        </Title>
        <p className="mb-4">
          <FormattedMessage {...messages.setupDescription} />
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
          <SimpleFormError>{() => <FormattedMessage {...messages.enableError} />}</SimpleFormError>
          <SimpleFormField
            icon="key"
            label={<FormattedMessage {...messages.verifyCode} />}
            maxLength={6}
            minLength={6}
            name="token"
            pattern="[0-9]{6}"
            placeholder={formatMessage(messages.verifyCodePlaceholder)}
            required
          />
          <FormButtons>
            <Button onClick={onCancelSetup}>
              <FormattedMessage {...messages.cancelButton} />
            </Button>
            <SimpleSubmit>
              <FormattedMessage {...messages.verifyButton} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </section>
    );
  }

  // Disable flow - only show if TOTP is not required
  if (isDisabling && !isRequired) {
    return (
      <section className="mb-5">
        <Title size={4}>
          <FormattedMessage {...messages.disableTitle} />
        </Title>
        <p className="mb-4">
          <FormattedMessage {...messages.disableDescription} />
        </p>
        <SimpleForm defaultValues={{ token: '' }} onSubmit={onDisable}>
          <SimpleFormError>{() => <FormattedMessage {...messages.disableError} />}</SimpleFormError>
          <SimpleFormField
            icon="key"
            label={<FormattedMessage {...messages.verifyCode} />}
            maxLength={6}
            minLength={6}
            name="token"
            pattern="[0-9]{6}"
            placeholder={formatMessage(messages.verifyCodePlaceholder)}
            required
          />
          <FormButtons>
            <Button onClick={onCancelDisable}>
              <FormattedMessage {...messages.cancelButton} />
            </Button>
            <SimpleSubmit color="danger">
              <FormattedMessage {...messages.disableButton} />
            </SimpleSubmit>
          </FormButtons>
        </SimpleForm>
      </section>
    );
  }

  // Default view - show status and enable/disable button
  return (
    <section className="mb-5">
      <Title size={4}>
        <FormattedMessage {...messages.title} />
      </Title>
      <p className="mb-4">
        <FormattedMessage {...messages.description} />
      </p>
      {isRequired && !totpEnabled ? (
        <div className="notification is-warning">
          <FormattedMessage {...messages.requiredNotice} />
        </div>
      ) : null}
      <div className="notification is-light">
        {totpEnabled ? (
          <>
            <Icon className="has-text-success mr-2" icon="check-circle" />
            <FormattedMessage {...messages.enabled} />
          </>
        ) : (
          <>
            <Icon className="has-text-warning mr-2" icon="exclamation-triangle" />
            <FormattedMessage {...messages.disabled} />
          </>
        )}
      </div>
      {totpEnabled ? (
        // Only show disable button if TOTP is not required
        isRequired ? null : (
          <Button color="danger" onClick={onStartDisable}>
            <FormattedMessage {...messages.disableButton} />
          </Button>
        )
      ) : (
        <Button color="primary" onClick={onStartSetup}>
          <FormattedMessage {...messages.enableButton} />
        </Button>
      )}
    </section>
  );
}
