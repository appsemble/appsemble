import { Icon } from '@appsemble/react-components';
import { permissions } from '@appsemble/utils';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import useUser from '../../hooks/useUser';
import checkRole from '../../utils/checkRole';
import { useApp } from '../AppContext';
import NavLink from '../NavLink';
import SideMenu from '../SideMenu';
import styles from './index.css';
import messages from './messages';

export interface AppSideMenuState {
  isCollapsed: boolean;
}

export default function AppSideMenu(): React.ReactElement {
  const { app } = useApp();

  const { userInfo } = useUser();
  const [isCollapsed, setCollapsed] = React.useState(false);
  const organizations = useOrganizations();
  const organization = organizations?.find((org) => org.id === app.OrganizationId);
  const match = useRouteMatch();

  const editPermission = organization && checkRole(organization.role, permissions.EditApps);
  const pushNotificationPermission =
    organization && checkRole(organization.role, permissions.PushNotifications);

  return (
    <SideMenu isCollapsed={isCollapsed} toggleCollapse={() => setCollapsed(!isCollapsed)}>
      <NavLink className={styles.menuItem} exact to={match.url}>
        <Icon icon="info" size="medium" />
        <span className={classNames({ 'is-hidden': isCollapsed })}>
          <FormattedMessage {...messages.details} />
        </span>
      </NavLink>
      {userInfo && organization && (
        <>
          {editPermission && (
            <>
              <NavLink className={styles.menuItem} exact to={`${match.url}/edit`}>
                <Icon icon="edit" size="medium" />
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.editor} />
                </span>
              </NavLink>

              <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/assets`}>
                <Icon icon="layer-group" size="medium" />
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.assets} />
                </span>
              </NavLink>

              <NavLink
                className={styles.menuItem}
                exact={!isCollapsed}
                to={`${match.url}/resources`}
              >
                <Icon icon="cubes" size="medium" />
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.resources} />
                </span>
              </NavLink>

              {app.definition.resources && !isCollapsed && (
                <ul>
                  {Object.keys(app.definition.resources)
                    .sort()
                    .map((resource) => (
                      <li key={resource}>
                        <NavLink
                          className={styles.menuItem}
                          to={`${match.url}/resources/${resource}`}
                        >
                          {resource}
                        </NavLink>
                      </li>
                    ))}
                </ul>
              )}
            </>
          )}
          {pushNotificationPermission && (
            <NavLink
              className={styles.menuItem}
              exact={!isCollapsed}
              to={`${match.url}/notifications`}
            >
              <Icon icon="paper-plane" size="medium" />
              <span className={classNames({ 'is-hidden': isCollapsed })}>
                <FormattedMessage {...messages.notifications} />
              </span>
            </NavLink>
          )}
          {editPermission && (
            <>
              {app.definition.security !== undefined && (
                <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/roles`}>
                  <Icon icon="users" size="medium" />
                  <span className={classNames({ 'is-hidden': isCollapsed })}>
                    <FormattedMessage {...messages.roles} />
                  </span>
                </NavLink>
              )}
              <NavLink
                className={styles.menuItem}
                exact={!isCollapsed}
                to={`${match.url}/settings`}
              >
                <Icon icon="cogs" size="medium" />
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.settings} />
                </span>
              </NavLink>
            </>
          )}
        </>
      )}
    </SideMenu>
  );
}
