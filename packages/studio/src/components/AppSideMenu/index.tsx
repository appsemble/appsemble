import { useToggle } from '@appsemble/react-components/src';
import { Permission } from '@appsemble/utils';
import React, { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import checkRole from '../../utils/checkRole';
import { useApp } from '../AppContext';
import NavLink from '../NavLink';
import SideMenu from '../SideMenu';
import SideNavLink from '../SideNavLink';
import { useUser } from '../UserProvider';
import messages from './messages';

export interface AppSideMenuState {
  isCollapsed: boolean;
}

export default function AppSideMenu(): ReactElement {
  const { app } = useApp();

  const collapsed = useToggle();
  const { organizations } = useUser();
  const organization = organizations?.find((org) => org.id === app.OrganizationId);
  const match = useRouteMatch();

  const editPermission = organization && checkRole(organization.role, Permission.EditApps);
  const pushNotificationPermission =
    organization && checkRole(organization.role, Permission.PushNotifications);

  return (
    <SideMenu isCollapsed={collapsed.enabled} toggleCollapse={collapsed.toggle}>
      <SideNavLink
        exact
        icon="info"
        label={<FormattedMessage {...messages.details} />}
        to={match.url}
      />
      {editPermission && (
        <>
          <SideNavLink
            icon="edit"
            label={<FormattedMessage {...messages.editor} />}
            to={`${match.url}/edit`}
          />

          <SideNavLink
            icon="layer-group"
            label={<FormattedMessage {...messages.assets} />}
            to={`${match.url}/assets`}
          />

          <SideNavLink
            icon="cubes"
            label={<FormattedMessage {...messages.resources} />}
            to={`${match.url}/resources`}
          >
            {app.definition.resources &&
              Object.keys(app.definition.resources)
                .sort()
                .map((resource) => (
                  <NavLink key={resource} to={`${match.url}/resources/${resource}`}>
                    {resource}
                  </NavLink>
                ))}
          </SideNavLink>
        </>
      )}
      {pushNotificationPermission && (
        <SideNavLink
          icon="paper-plane"
          label={<FormattedMessage {...messages.notifications} />}
          to={`${match.url}/notifications`}
        />
      )}
      {editPermission && (
        <>
          {app.definition.security !== undefined && (
            <SideNavLink
              icon="users"
              label={<FormattedMessage {...messages.roles} />}
              to={`${match.url}/roles`}
            />
          )}
          <SideNavLink
            icon="cogs"
            label={<FormattedMessage {...messages.settings} />}
            to={`${match.url}/settings`}
          />
          <SideNavLink
            icon="key"
            label={<FormattedMessage {...messages.secrets} />}
            to={`${match.url}/secrets`}
          />
        </>
      )}
    </SideMenu>
  );
}
