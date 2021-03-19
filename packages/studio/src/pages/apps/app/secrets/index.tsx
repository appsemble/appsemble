import { Checkbox, Content, Title, useMeta } from '@appsemble/react-components';
import axios from 'axios';
import { ReactElement, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';

import { useApp } from '..';
import { messages } from './messages';
import { OAuth2Secrets } from './OAuth2Secrets';
import { SamlSecrets } from './SamlSecrets';

export function SecretsPage(): ReactElement {
  useMeta(messages.title);
  const { app, setApp } = useApp();
  const [submitting, setSubmitting] = useState(false);

  const onClickCheckbox = useCallback(async () => {
    setSubmitting(true);
    const formData = new FormData();
    formData.set('showAppsembleLogin', String(!app.showAppsembleLogin));
    await axios.patch(`/api/apps/${app.id}`, formData);
    setApp({ ...app, showAppsembleLogin: !app.showAppsembleLogin });
    setSubmitting(false);
  }, [app, setApp, setSubmitting]);

  return (
    <Content>
      <Title>
        <FormattedMessage {...messages.title} />
      </Title>
      <div className="mb-4">
        <Title size={4}>
          <FormattedMessage {...messages.appsembleLogin} />
        </Title>
        <Checkbox
          disabled={app.locked || submitting}
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
