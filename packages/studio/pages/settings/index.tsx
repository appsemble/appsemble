import {
  Content,
  MenuItem,
  MenuSection,
  MetaSwitch,
  useSideMenu,
} from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AppsRoutes } from './apps/index.js';
import { ClientCredentialsPage } from './client-credentials/index.js';
import { messages } from './messages.js';
import { SocialPage } from './social/index.js';
import { UserPage } from './user/index.js';

export function SettingsRoutes(): ReactElement {
  const { path, url } = useRouteMatch();

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
    </MenuSection>,
  );

  return (
    <Content fullwidth>
      <MetaSwitch title={messages.title}>
        <Route exact path={`${path}/user`}>
          <UserPage />
        </Route>
        <Route exact path={`${path}/social`}>
          <SocialPage />
        </Route>
        <Route exact path={`${path}/client-credentials`}>
          <ClientCredentialsPage />
        </Route>
        <Route path={`${path}/apps`}>
          <AppsRoutes />
        </Route>
        <Redirect to={`${url}/user`} />
      </MetaSwitch>
    </Content>
  );
}
