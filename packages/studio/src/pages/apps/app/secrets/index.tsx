import { AsyncCheckbox, Content, Title, useMeta } from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '..';
import { messages } from './messages';
import { OAuth2Secrets } from './OAuth2Secrets';
import { SamlSecrets } from './SamlSecrets';

export function SecretsPage(): ReactElement {
  useMeta(messages.title);
  const { app, setApp } = useApp();

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
          disabled={app.locked}
          label={<FormattedMessage {...messages.displayAppsembleLogin} />}
          name="enableAppsembleLogin"
          onChange={onClickCheckbox}
          value={app.showAppsembleLogin}
        />
      </div>
      <OAuth2Secrets />
      <SamlSecrets />
    </Content>
  );
}
