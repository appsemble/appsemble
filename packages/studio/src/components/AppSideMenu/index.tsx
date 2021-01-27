import { useToggle } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { FormattedMessage } from 'react-intl';
import { useRouteMatch } from 'react-router-dom';

import { checkRole } from '../../utils/checkRole';
import { useApp } from '../AppContext';
import { NavLink } from '../NavLink';
import { SideMenu } from '../SideMenu';
import { SideNavLink } from '../SideNavLink';
import { useUser } from '../UserProvider';
import { messages } from './messages';

export interface AppSideMenuState {
  isCollapsed: boolean;
}

export function AppSideMenu(): ReactElement {
  const { app } = useApp();

  const collapsed = useToggle();
  const { organizations } = useUser();
  const organization = organizations?.find((org) => org.id === app.OrganizationId);
  const { url } = useRouteMatch();

  const editPermission = organization && checkRole(organization.role, Permission.EditApps);
  const editMessagePermission =
    organization && checkRole(organization.role, Permission.EditAppMessages);
  const pushNotificationPermission =
    organization && checkRole(organization.role, Permission.PushNotifications);

  return (
    <SideMenu isCollapsed={collapsed.enabled} toggleCollapse={collapsed.toggle}>
      <SideNavLink exact icon="info" label={<FormattedMessage {...messages.details} />} to={url} />
      {editPermission && (
        <>
          <SideNavLink
            icon="edit"
            label={<FormattedMessage {...messages.editor} />}
            to={`${url}/edit`}
          />

          <SideNavLink
            icon="layer-group"
            label={<FormattedMessage {...messages.assets} />}
            to={`${url}/assets`}
          />

          <SideNavLink
            icon="cubes"
            label={<FormattedMessage {...messages.resources} />}
            to={`${url}/resources`}
          >
            {app.definition.resources &&
              Object.keys(app.definition.resources)
                .sort()
                .map((resource) => (
                  <NavLink key={resource} to={`${url}/resources/${resource}`}>
                    {resource}
                  </NavLink>
                ))}
          </SideNavLink>
        </>
      )}
      {editMessagePermission && (
        <SideNavLink
          icon="language"
          label={<FormattedMessage {...messages.translations} />}
          to={`${url}/translations`}
        />
      )}
      {pushNotificationPermission && (
        <SideNavLink
          icon="paper-plane"
          label={<FormattedMessage {...messages.notifications} />}
          to={`${url}/notifications`}
        />
      )}
      {editPermission && (
        <>
          {app.definition.security !== undefined && (
            <>
              <SideNavLink
                icon="users"
                label={<FormattedMessage {...messages.roles} />}
                to={`${url}/roles`}
              />
              <SideNavLink
                icon="hands-helping"
                label={<FormattedMessage {...messages.teams} />}
                to={`${url}/teams`}
              />
            </>
          )}
          <SideNavLink
            icon="cogs"
            label={<FormattedMessage {...messages.settings} />}
            to={`${url}/settings`}
          />
          <SideNavLink
            icon="key"
            label={<FormattedMessage {...messages.secrets} />}
            to={`${url}/secrets`}
          />
        </>
      )}
    </SideMenu>
  );
}
