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

import { ClientCredentialsPage } from './client-credentials';
import { messages } from './messages';
import { SocialPage } from './social';
import { UserPage } from './user';

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
        <Redirect to={`${url}/user`} />
      </MetaSwitch>
    </Content>
  );
}
