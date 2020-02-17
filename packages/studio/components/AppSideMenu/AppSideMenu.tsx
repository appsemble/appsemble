import { Icon } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { permissions } from '@appsemble/utils';
import classNames from 'classnames';
import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl';
import { RouteComponentProps, useRouteMatch } from 'react-router-dom';

import useApp from '../../hooks/useApp';
import useOrganizations from '../../hooks/useOrganizations';
import useUser from '../../hooks/useUser';
import checkRole from '../../utils/checkRole';
import NavLink from '../NavLink';
import SideMenu from '../SideMenu';
import styles from './AppSideMenu.css';
import messages from './messages';

export interface AppSideMenuState {
  isCollapsed: boolean;
}

export default function AppSideMenu(): React.ReactElement {
  const { userInfo } = useUser();
  const [isCollapsed, setCollapsed] = React.useState(false);
  const app = useApp();
  const organizations = useOrganizations();
  const organization = organizations && organizations.find(org => org.id === app.OrganizationId);
  const match = useRouteMatch<{ id: string }>();

  return (
    <SideMenu isCollapsed={isCollapsed} toggleCollapse={() => setCollapsed(!isCollapsed)}>
      <NavLink className={styles.menuItem} exact to={match.url}>
        <Icon icon="info" size="medium" />
        <span className={classNames({ 'is-hidden': isCollapsed })}>
          <FormattedMessage {...messages.details} />
        </span>
      </NavLink>
      {userInfo && (
        <>
          {organization && checkRole(organization.role, permissions.EditApps) && (
            <NavLink className={styles.menuItem} exact to={`${match.url}/edit`}>
              <Icon icon="edit" size="medium" />
              <span className={classNames({ 'is-hidden': isCollapsed })}>
                <FormattedMessage {...messages.editor} />
              </span>
            </NavLink>
          )}
          {organization && checkRole(organization.role, permissions.EditApps) && (
            <>
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
                    .map(resource => (
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
          {organization && checkRole(organization.role, permissions.PushNotifications) && (
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
          {organization &&
            app.definition.security !== undefined &&
            checkRole(organization.role, permissions.EditApps) && (
              <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/roles`}>
                <Icon icon="users" size="medium" />
                <span className={classNames({ 'is-hidden': isCollapsed })}>
                  <FormattedMessage {...messages.roles} />
                </span>
              </NavLink>
            )}
          {organization && checkRole(organization.role, permissions.EditAppSettings) && (
            <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/settings`}>
              <Icon icon="cogs" size="medium" />
              <span className={classNames({ 'is-hidden': isCollapsed })}>
                <FormattedMessage {...messages.settings} />
              </span>
            </NavLink>
          )}
        </>
      )}
    </SideMenu>
  );
}
