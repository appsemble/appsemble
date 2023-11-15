import {
  Content,
  MenuItem,
  MenuSection,
  MetaSwitch,
  useSideMenu,
} from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { AppsRoutes } from './apps/index.js';
import { ClientCredentialsPage } from './client-credentials/index.js';
import { messages } from './messages.js';
import { SocialPage } from './social/index.js';
import { TrainingRoutes } from './trainings/index.js';
import { UserPage } from './user/index.js';

export function SettingsRoutes(): ReactNode {
  const { lang } = useParams<{ lang: string }>();
  const url = `/${lang}/settings`;

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      <MenuItem icon="user" to={`${url}/user`}>
        <FormattedMessage {...messages.user} />
      </MenuItem>
      <MenuSection>
        <MenuItem to={`${url}/social`}>
          <FormattedMessage {...messages.socialLogin} />
        </MenuItem>
        <MenuItem to={`${url}/apps`}>
          <FormattedMessage {...messages.connectedApps} />
        </MenuItem>
      </MenuSection>
      <MenuItem icon="key" to={`${url}/client-credentials`}>
        <FormattedMessage {...messages.clientCredentials} />
      </MenuItem>
      <MenuItem icon="graduation-cap" to={`${url}/trainings`}>
        <FormattedMessage {...messages.training} />
      </MenuItem>
    </MenuSection>,
  );

  return (
    <Content fullwidth>
      <MetaSwitch title={messages.title}>
        <Route element={<UserPage />} path="/user" />
        <Route element={<SocialPage />} path="/social" />
        <Route element={<ClientCredentialsPage />} path="/client-credentials" />
        <Route element={<AppsRoutes />} path="/apps/*" />
        <Route element={<Navigate to={`${url}/user`} />} path="*" />
        <Route element={<TrainingRoutes />} path="trainings/*" />
      </MetaSwitch>
    </Content>
  );
}
