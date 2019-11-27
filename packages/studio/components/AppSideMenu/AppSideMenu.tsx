import { Icon } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import classNames from 'classnames';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { RouteComponentProps } from 'react-router-dom';

import { User } from '../../types';
import NavLink from '../NavLink';
import SideMenu from '../SideMenu';
import styles from './AppSideMenu.css';
import messages from './messages';

export interface AppSideMenuProps {
  app: App;
  user: User;
}

export interface AppSideMenuState {
  isCollapsed: boolean;
}

export default function AppSideMenu({
  app,
  match,
  user,
}: AppSideMenuProps & RouteComponentProps): React.ReactElement {
  const [isCollapsed, setCollapsed] = React.useState(false);

  return (
    <SideMenu isCollapsed={isCollapsed} toggleCollapse={() => setCollapsed(!isCollapsed)}>
      <NavLink className={styles.menuItem} exact to={match.url}>
        <Icon icon="info" size="medium" />
        <span className={classNames({ 'is-hidden': isCollapsed })}>
          <FormattedMessage {...messages.details} />
        </span>
      </NavLink>
      {user && (
        <>
          <NavLink className={styles.menuItem} exact to={`${match.url}/edit`}>
            <Icon icon="edit" size="medium" />
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.editor} />
            </span>
          </NavLink>
          <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/resources`}>
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
                    <NavLink className={styles.menuItem} to={`${match.url}/resources/${resource}`}>
                      {resource}
                    </NavLink>
                  </li>
                ))}
            </ul>
          )}
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
          <NavLink className={styles.menuItem} exact={!isCollapsed} to={`${match.url}/settings`}>
            <Icon icon="cogs" size="medium" />
            <span className={classNames({ 'is-hidden': isCollapsed })}>
              <FormattedMessage {...messages.settings} />
            </span>
          </NavLink>
        </>
      )}
    </SideMenu>
  );
}
