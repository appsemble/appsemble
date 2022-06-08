import {
  AsyncCheckbox,
  CheckboxField,
  Content,
  PasswordField,
  SimpleForm,
  SimpleFormField,
  SimpleSubmit,
  Title,
  useMeta,
} from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { Collapsible } from 'studio/src/components/Collapsible';

import { useApp } from '..';
import { messages } from './messages';
import { OAuth2Secrets } from './OAuth2Secrets';
import { SamlSecrets } from './SamlSecrets';

export function SecretsPage(): ReactElement {
  useMeta(messages.title);
  const { app, setApp } = useApp();

  const onClickOAuth2Checkbox = useCallback(async () => {
    const formData = new FormData();
    formData.set('showAppsembleOAuth2Login', String(!app.showAppsembleOAuth2Login));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, showAppsembleOAuth2Login: !app.showAppsembleOAuth2Login });
  }, [app, setApp]);

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
        <SimpleForm
          defaultValues={{
            emailName: 'Appsemble',
            emailHost: '',
            emailPassword: '',
            emailPort: 587,
            emailSecure: true,
          }}
          // eslint-disable-next-line no-console
          onSubmit={(values) => console.log(values)}
        >
          <SimpleFormField
            autoComplete="off"
            label={<FormattedMessage {...messages.emailName} />}
            name="emailName"
          />
          <SimpleFormField
            autoComplete="off"
            label={<FormattedMessage {...messages.emailUser} />}
            name="emailUser"
          />
          <SimpleFormField
            autoComplete="off"
            label={<FormattedMessage {...messages.emailHost} />}
            name="emailHost"
          />
          <SimpleFormField
            autoComplete="off"
            component={PasswordField}
            label={<FormattedMessage {...messages.emailPassword} />}
            name="emailPassword"
          />
          <SimpleFormField
            label={<FormattedMessage {...messages.emailPort} />}
            name="emailPort"
            type="number"
          />
          <SimpleFormField
            component={CheckboxField}
            label={<FormattedMessage {...messages.emailSecure} />}
            name="emailSecure"
          />
          <SimpleSubmit>
            <FormattedMessage {...messages.submit} />
          </SimpleSubmit>
        </SimpleForm>
      </Collapsible>
      <OAuth2Secrets />
      <SamlSecrets />
    </Content>
  );
}
