import { Content, useToggle } from '@appsemble/react-components';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import ClientCredentials from '../ClientCredentials';
import NavLink from '../NavLink';
import OAuthSettings from '../OAuthSettings';
import OrganizationsSettings from '../OrganizationsSettings';
import SideMenu from '../SideMenu';
import SideNavLink from '../SideNavLink';
import UserSettings from '../UserSettings';
import styles from './index.css';
import messages from './messages';

export default function Settings(): React.ReactElement {
  const collapsed = useToggle();
  const match = useRouteMatch();

  return (
    <div className={styles.container}>
      <SideMenu isCollapsed={collapsed.enabled} toggleCollapse={collapsed.toggle}>
        <SideNavLink
          icon="user"
          label={<FormattedMessage {...messages.user} />}
          to={`${match.url}/user`}
        >
          <NavLink to={`${match.url}/social`}>
            <FormattedMessage {...messages.socialLogin} />
          </NavLink>
        </SideNavLink>
        <SideNavLink
          icon="briefcase"
          label={<FormattedMessage {...messages.organizations} />}
          to={`${match.url}/organizations`}
        />
        <SideNavLink
          icon="key"
          label={<FormattedMessage {...messages.clientCredentials} />}
          to={`${match.url}/client-credentials`}
        />
      </SideMenu>
      <Content className={styles.content} fullwidth padding>
        <Switch>
          <Route exact path={`${match.path}/user`}>
            <UserSettings />
          </Route>
          <Route exact path={`${match.path}/social`}>
            <OAuthSettings />
          </Route>
          <Route exact path={`${match.path}/organizations`}>
            <OrganizationsSettings />
          </Route>
          <Route exact path={`${match.path}/client-credentials`}>
            <ClientCredentials />
          </Route>
          <Redirect to={`${match.path}/user`} />
        </Switch>
      </Content>
    </div>
  );
}
