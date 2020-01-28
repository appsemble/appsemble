import { Icon } from '@appsemble/react-components';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import ClientCredentials from '../ClientCredentials';
import NavLink from '../NavLink';
import OrganizationsSettings from '../OrganizationsSettings';
import SideMenu from '../SideMenu';
import UserSettings from '../UserSettings';
import messages from './messages';
import styles from './Settings.css';

export default function Settings(): React.ReactElement {
  const [isCollapsed, setCollapsed] = React.useState(false);
  const match = useRouteMatch();

  const toggle = React.useCallback(() => {
    setCollapsed(!isCollapsed);
  }, [isCollapsed]);

  return (
    <div className={styles.container}>
      <SideMenu isCollapsed={isCollapsed} toggleCollapse={toggle}>
        <NavLink className={styles.menuItem} exact to={`${match.url}/user`}>
          <Icon icon="user" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.user} />
          </span>
        </NavLink>
        <NavLink className={styles.menuItem} exact to={`${match.url}/organizations`}>
          <Icon icon="briefcase" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.organizations} />
          </span>
        </NavLink>
        <NavLink className={styles.menuItem} exact to={`${match.url}/client-credentials`}>
          <Icon icon="key" size="medium" />
          <span className={classNames({ 'is-hidden': isCollapsed })}>
            <FormattedMessage {...messages.clientCredentials} />
          </span>
        </NavLink>
      </SideMenu>
      <div className={styles.content}>
        <Switch>
          <Route component={UserSettings} exact path={`${match.path}/user`} />
          <Route component={OrganizationsSettings} exact path={`${match.path}/organizations`} />
          <Route component={ClientCredentials} exact path={`${match.path}/client-credentials`} />
          <Redirect to={`${match.path}/user`} />
        </Switch>
      </div>
    </div>
  );
}
