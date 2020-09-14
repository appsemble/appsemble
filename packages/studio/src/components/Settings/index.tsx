import { Content, useToggle } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ClientCredentials } from '../ClientCredentials';
import { NavLink } from '../NavLink';
import { OAuthSettings } from '../OAuthSettings';
import { Organizations } from '../Organizations';
import { SideMenu } from '../SideMenu';
import { SideNavLink } from '../SideNavLink';
import { UserSettings } from '../UserSettings';
import styles from './index.css';
import { messages } from './messages';

export function Settings(): ReactElement {
  const collapsed = useToggle();
  const { path, url } = useRouteMatch();

  return (
    <div className={styles.container}>
      <SideMenu isCollapsed={collapsed.enabled} toggleCollapse={collapsed.toggle}>
        <SideNavLink icon="user" label={<FormattedMessage {...messages.user} />} to={`${url}/user`}>
          <NavLink to={`${url}/social`}>
            <FormattedMessage {...messages.socialLogin} />
          </NavLink>
        </SideNavLink>
        <SideNavLink
          icon="briefcase"
          label={<FormattedMessage {...messages.organizations} />}
          to={`${url}/organizations`}
        />
        <SideNavLink
          icon="key"
          label={<FormattedMessage {...messages.clientCredentials} />}
          to={`${url}/client-credentials`}
        />
      </SideMenu>
      <Content className={styles.content} fullwidth padding>
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
    </div>
  );
}
