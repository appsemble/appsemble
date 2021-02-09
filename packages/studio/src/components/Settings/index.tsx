import { Content, MenuSection, useSideMenu } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ClientCredentials } from '../ClientCredentials';
import { MenuItem } from '../MenuItem';
import { OAuthSettings } from '../OAuthSettings';
import { Organizations } from '../Organizations';
import { UserSettings } from '../UserSettings';
import { messages } from './messages';

export function Settings(): ReactElement {
  const { path, url } = useRouteMatch();

  useSideMenu(
    <MenuSection label={<FormattedMessage {...messages.settings} />}>
      <MenuItem icon="user" to={`${url}/user`}>
        <FormattedMessage {...messages.user} />
      </MenuItem>
      <MenuSection>
        <MenuItem to={`${url}/social`}>
          <FormattedMessage {...messages.socialLogin} />
        </MenuItem>
      </MenuSection>
      <MenuItem icon="briefcase" to={`${url}/organizations`}>
        <FormattedMessage {...messages.organizations} />
      </MenuItem>
      <MenuItem icon="key" to={`${url}/client-credentials`}>
        <FormattedMessage {...messages.clientCredentials} />
      </MenuItem>
    </MenuSection>,
  );

  return (
    <Content fullwidth>
      <Switch>
        <Route exact path={`${path}/user`}>
          <UserSettings />
        </Route>
        <Route exact path={`${path}/social`}>
          <OAuthSettings />
        </Route>
        <Route path={`${path}/organizations`}>
          <Organizations />
        </Route>
        <Route exact path={`${path}/client-credentials`}>
          <ClientCredentials />
        </Route>
        <Redirect to={`${url}/user`} />
      </Switch>
    </Content>
  );
}
