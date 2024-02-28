import {
  Content,
  MenuItem,
  MenuSection,
  MetaSwitch,
  useSideMenu,
} from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate, Route } from 'react-router-dom';

import { AppsRoutes } from './apps/index.js';
import { ClientCredentialsPage } from './client-credentials/index.js';
import { messages } from './messages.js';
import { SocialPage } from './social/index.js';
import { UserPage } from './user/index.js';

export function SettingsRoutes(): ReactNode {
  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.title} />}>
      <MenuItem icon="user" to="settings/user">
        <FormattedMessage {...messages.user} />
      </MenuItem>
      <MenuSection>
        <MenuItem to="settings/user/social">
          <FormattedMessage {...messages.socialLogin} />
        </MenuItem>
        <MenuItem to="settings/user/apps">
          <FormattedMessage {...messages.connectedApps} />
        </MenuItem>
      </MenuSection>
      <MenuItem icon="key" to="settings/client-credentials">
        <FormattedMessage {...messages.clientCredentials} />
      </MenuItem>
    </MenuSection>,
  );

  return (
    <Content fullwidth>
      <MetaSwitch title={messages.title}>
        <Route element={<UserPage />} path="/user" />
        <Route element={<SocialPage />} path="/user/social" />
        <Route element={<AppsRoutes />} path="/user/apps/*" />
        <Route element={<ClientCredentialsPage />} path="/client-credentials" />
        <Route element={<Navigate to="user" />} path="*" />
      </MetaSwitch>
    </Content>
  );
}
