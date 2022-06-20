import {
  AsyncCheckbox,
  CheckboxField,
  Content,
  PasswordField,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useData,
  useMessages,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { AsyncDataView } from 'studio/src/components/AsyncDataView';
import { Collapsible } from 'studio/src/components/Collapsible';

import { useApp } from '..';
import { messages } from './messages';
import { OAuth2Secrets } from './OAuth2Secrets';
import { SamlSecrets } from './SamlSecrets';

interface EmailFormParameters {
  emailName: string;
  emailHost: string;
  emailUser: string;
  emailPassword: string;
  emailPort: number;
  emailSecure: boolean;
}

export function SecretsPage(): ReactElement {
  useMeta(messages.title);
  const { app, setApp } = useApp();
  const push = useMessages();
  const { formatMessage } = useIntl();
  const emailSettingsResult = useData<
    Omit<EmailFormParameters, 'emailPassword'> & { emailPassword: boolean }
  >(`/api/apps/${app.id}/email`);

  const onClickOAuth2Checkbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('showAppsembleOAuth2Login', String(!app.showAppsembleOAuth2Login));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, showAppsembleOAuth2Login: !app.showAppsembleOAuth2Login });
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

  const onClickCheckbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('showAppsembleLogin', String(!app.showAppsembleLogin));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, showAppsembleLogin: !app.showAppsembleLogin });
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
          disabled={app.locked}
          label={<FormattedMessage {...messages.displayAppsembleOAuth2Login} />}
          name="enableAppsembleOAuth2Login"
          onChange={onClickOAuth2Checkbox}
          value={app.showAppsembleOAuth2Login}
        />
        <AsyncCheckbox
          disabled={app.locked}
          label={<FormattedMessage {...messages.displayAppsembleLogin} />}
          name="enableAppsembleLogin"
          onChange={onClickCheckbox}
          value={app.showAppsembleLogin}
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
                autoComplete="off"
                component={PasswordField}
                help={<FormattedMessage {...messages.emailPasswordDescription} />}
                label={<FormattedMessage {...messages.emailPassword} />}
                name="emailPassword"
                placeholder="●●●●●●●●●●●"
                required={Boolean(emailSettings.emailHost || emailSettings.emailUser)}
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
              <SimpleSubmit>
                <FormattedMessage {...messages.submit} />
              </SimpleSubmit>
            </SimpleForm>
          )}
        </AsyncDataView>
      </Collapsible>
      <OAuth2Secrets />
      <SamlSecrets />
    </Content>
  );
}
