import {
  AsyncCheckbox,
  CheckboxField,
  Content,
  PasswordField,
  SimpleForm,
  SimpleFormError,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { OAuth2Secrets } from './OAuth2Secrets/index.js';
import { SamlSecrets } from './SamlSecrets/index.js';
import { ScimSecrets } from './ScimSecrets/index.js';
import { ServiceSecrets } from './ServiceSecrets/index.js';
import { SSLSecrets } from './SSLSecrets/index.js';
import { AsyncDataView } from '../../../../components/AsyncDataView/index.js';
import { Collapsible } from '../../../../components/Collapsible/index.js';
import { useApp } from '../index.js';
import { WebhookSecrets } from './WebhookSecrets/index.js';

interface EmailFormParameters {
  emailName: string;
  emailHost: string;
  emailUser: string;
  emailPassword: string;
  emailPort: number;
  emailSecure: boolean;
}

interface PaymentFormParameters {
  stripeApiKey: string;
  stripeSecret: string;
  successUrl: string;
  cancelUrl: string;
  enablePayments: boolean;
}

export function SecretsPage(): ReactNode {
  useMeta(messages.title);
  const { app, setApp } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const emailSettingsResult = useData<
    Omit<EmailFormParameters, 'emailPassword'> & { emailPassword: boolean }
  >(`/api/apps/${app.id}/email`);
  const paymentSettingsResult = useData<
    Omit<PaymentFormParameters, 'stripeApiKey' | 'stripeSecret'> & {
      stripeSecret: boolean;
      stripeApiKey: boolean;
    }
  >(`/api/apps/${app.id}/payment`);
  const [enablePayments, setEnablePayments] = useState<boolean>(
    paymentSettingsResult?.data?.enablePayments || false,
  );
  useEffect(() => {
    if (paymentSettingsResult?.data?.enablePayments !== undefined) {
      setEnablePayments(paymentSettingsResult.data.enablePayments);
    }
  }, [paymentSettingsResult?.data?.enablePayments]);
  const toggleEnablePayments = useCallback(() => {
    setEnablePayments(!enablePayments);
  }, [setEnablePayments, enablePayments]);

  const onClickOAuth2Checkbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('showAppsembleOAuth2Login', String(!app.showAppsembleOAuth2Login));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, showAppsembleOAuth2Login: !app.showAppsembleOAuth2Login });
  }, [app, setApp]);

  const onClickSelfRegistrationCheckbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('enableSelfRegistration', String(!app.enableSelfRegistration));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, enableSelfRegistration: !app.enableSelfRegistration });
  }, [app, setApp]);

  const onSaveEmailSettings = useCallback(
    async (values: EmailFormParameters) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
      }
      await axios.patch(`/api/apps/${app.id}`, formData);
      push({ color: 'success', body: formatMessage(messages.emailUpdateSuccess) });
      emailSettingsResult.setData({
        ...values,
        emailPassword: Boolean(values.emailPassword),
      });
    },
    [app, emailSettingsResult, formatMessage, push],
  );

  const onSavePaymentSettings = useCallback(
    async (values: PaymentFormParameters) => {
      const formData = new FormData();
      for (const [key, value] of Object.entries(values)) {
        formData.set(key, value);
      }
      await axios.patch(`/api/apps/${app.id}/payment`, formData);
      push({ color: 'success', body: formatMessage(messages.paymentUpdateSuccess) });
      paymentSettingsResult.setData({
        ...values,
        stripeApiKey: Boolean(values.stripeApiKey),
        stripeSecret: Boolean(values.stripeSecret),
      });
    },
    [app, paymentSettingsResult, formatMessage, push],
  );

  const onClickLoginCheckbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('showAppsembleLogin', String(!app.showAppsembleLogin));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, showAppsembleLogin: !app.showAppsembleLogin });
  }, [app, setApp]);

  const onClickServiceCheckbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('enableUnsecuredServiceSecrets', String(!app.enableUnsecuredServiceSecrets));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, enableUnsecuredServiceSecrets: !app.enableUnsecuredServiceSecrets });
  }, [app, setApp]);

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="mb-4">
        <Title size={4}>
          <FormattedMessage {...messages.appsembleLogin} />
        </Title>
        <AsyncCheckbox
          className="is-block mb-2"
          disabled={app.locked !== 'unlocked'}
          label={<FormattedMessage {...messages.displayAppsembleOAuth2Login} />}
          name="enableAppsembleOAuth2Login"
          onChange={onClickOAuth2Checkbox}
          value={app.showAppsembleOAuth2Login}
        />
        <AsyncCheckbox
          className="is-block mb-2"
          disabled={app.locked !== 'unlocked'}
          label={<FormattedMessage {...messages.displayAppsembleLogin} />}
          name="enableAppsembleLogin"
          onChange={onClickLoginCheckbox}
          value={app.showAppsembleLogin}
        />
        <AsyncCheckbox
          className="is-block mb-2"
          disabled={app.locked !== 'unlocked'}
          label={<FormattedMessage {...messages.displaySelfRegistration} />}
          name="enableSelfRegistration"
          onChange={onClickSelfRegistrationCheckbox}
          value={app.enableSelfRegistration}
        />
      </div>
      <Collapsible collapsed={false} title={<FormattedMessage {...messages.emailSettings} />}>
        <AsyncDataView
          errorMessage={<FormattedMessage {...messages.emailSettingsError} />}
          loadingMessage={<FormattedMessage {...messages.emailLoading} />}
          result={emailSettingsResult}
        >
          {(emailSettings) => (
            <SimpleForm
              defaultValues={{
                ...emailSettings,
                emailPassword: '',
              }}
              onSubmit={onSaveEmailSettings}
            >
              <SimpleFormField
                autoComplete="off"
                help={<FormattedMessage {...messages.emailNameDescription} />}
                label={<FormattedMessage {...messages.emailName} />}
                name="emailName"
              />
              <SimpleFormField
                autoComplete="off"
                help={<FormattedMessage {...messages.emailHostDescription} />}
                label={<FormattedMessage {...messages.emailHost} />}
                name="emailHost"
                required={Boolean(emailSettings.emailPassword || emailSettings.emailUser)}
              />
              <SimpleFormField
                autoComplete="off"
                help={<FormattedMessage {...messages.emailUserDescription} />}
                label={<FormattedMessage {...messages.emailUser} />}
                name="emailUser"
                required={Boolean(emailSettings.emailPassword || emailSettings.emailHost)}
              />
              <SimpleFormField
                autoComplete="new-password"
                component={PasswordField}
                help={<FormattedMessage {...messages.emailPasswordDescription} />}
                label={<FormattedMessage {...messages.emailPassword} />}
                name="emailPassword"
                placeholder="●●●●●●●●●●●"
                required={
                  !emailSettings.emailPassword &&
                  Boolean(emailSettings.emailHost || emailSettings.emailUser)
                }
              />
              <SimpleFormField
                help={<FormattedMessage {...messages.emailPortDescription} />}
                label={<FormattedMessage {...messages.emailPort} />}
                name="emailPort"
                type="number"
              />
              <SimpleFormField
                component={CheckboxField}
                help={<FormattedMessage {...messages.emailSecureDescription} />}
                label={<FormattedMessage {...messages.emailSecure} />}
                name="emailSecure"
                required={Boolean(
                  emailSettings.emailHost || emailSettings.emailUser || emailSettings.emailPassword,
                )}
              />
              <SimpleFormError>
                {() => <FormattedMessage {...messages.submitError} />}
              </SimpleFormError>
              <SimpleSubmit>
                <FormattedMessage {...messages.submit} />
              </SimpleSubmit>
            </SimpleForm>
          )}
        </AsyncDataView>
      </Collapsible>
      <Collapsible collapsed={false} title={<FormattedMessage {...messages.paymentSettings} />}>
        <AsyncDataView
          errorMessage={<FormattedMessage {...messages.emailSettingsError} />}
          loadingMessage={<FormattedMessage {...messages.emailLoading} />}
          result={paymentSettingsResult}
        >
          {(paymentSettings) => (
            <SimpleForm
              defaultValues={{
                ...paymentSettings,
                stripeApiKey: '',
                stripeSecret: '',
              }}
              onSubmit={onSavePaymentSettings}
            >
              <SimpleFormField
                component={CheckboxField}
                help={<FormattedMessage {...messages.enablePaymentsDescription} />}
                name="enablePayments"
                onChange={toggleEnablePayments}
              />
              <SimpleFormField
                autoComplete="stripe-api-key"
                component={PasswordField}
                disabled={!enablePayments}
                help={<FormattedMessage {...messages.stripeApiKeyDescription} />}
                label={<FormattedMessage {...messages.stripeApiKey} />}
                name="stripeApiKey"
                placeholder="●●●●●●●●●●●"
                required={enablePayments}
              />
              <SimpleFormField
                autoComplete="stripe-secret"
                component={PasswordField}
                disabled={!enablePayments}
                help={<FormattedMessage {...messages.stripeSecretDescription} />}
                label={<FormattedMessage {...messages.stripeSecret} />}
                name="stripeSecret"
                placeholder="●●●●●●●●●●●"
                required
              />
              <SimpleFormField
                autoComplete="off"
                disabled={!enablePayments}
                help={<FormattedMessage {...messages.successUrlDescription} />}
                label={<FormattedMessage {...messages.successUrl} />}
                name="successUrl"
                required
              />
              <SimpleFormField
                autoComplete="off"
                disabled={!enablePayments}
                help={<FormattedMessage {...messages.cancelUrlDescription} />}
                label={<FormattedMessage {...messages.cancelUrl} />}
                name="cancelUrl"
                required
              />
              <SimpleFormError>
                {() => <FormattedMessage {...messages.submitError} />}
              </SimpleFormError>
              <SimpleSubmit>
                <FormattedMessage {...messages.submit} />
              </SimpleSubmit>
            </SimpleForm>
          )}
        </AsyncDataView>
      </Collapsible>
      <ServiceSecrets onClickServiceCheckbox={onClickServiceCheckbox} />
      <OAuth2Secrets />
      <SamlSecrets />
      {app.definition.webhooks && Object.keys(app.definition.webhooks).length > 0 ? (
        <WebhookSecrets />
      ) : null}
      <Collapsible
        help={
          <FormattedMessage
            {...messages.sslDescription}
            values={{
              link: (link) => (
                <Link rel="noopener noreferrer" target="_blank" to="../../../docs/guides/tls">
                  {link}
                </Link>
              ),
            }}
          />
        }
        title={<FormattedMessage {...messages.ssl} />}
      >
        <SSLSecrets />
      </Collapsible>
      <Collapsible title="SCIM">
        <ScimSecrets />
      </Collapsible>
    </Content>
  );
}
