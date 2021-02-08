import { Loader, MenuSection, Message, useData, useSideMenu } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import { createContext, Dispatch, ReactElement, SetStateAction, useContext, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { checkRole } from '../../utils/checkRole';
import { AppDetails } from '../AppDetails';
import { AppSecrets } from '../AppSecrets';
import { AppSettings } from '../AppSettings';
import { Assets } from '../Assets';
import { CMS } from '../CMS';
import { Editor } from '../Editor';
import { MenuItem } from '../MenuItem';
import { MessageEditor } from '../MessageEditor';
import { Notifications } from '../Notifications';
import { ProtectedRoute } from '../ProtectedRoute';
import { Roles } from '../Roles';
import { TeamSettings } from '../Teams/TeamSettings';
import { TeamsList } from '../Teams/TeamsList';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
interface AppValueContext {
  /**
   * The app in the current URL context.
   */
  app: App;

  /**
   * Update the app in the current context.
   */
  setApp: Dispatch<SetStateAction<App>>;
}

const Context = createContext<AppValueContext>(null);

export function AppContext(): ReactElement {
  const {
    params: { id },
    path,
    url,
  } = useRouteMatch<{ id: string; lang: string }>();
  const { organizations } = useUser();
  const { data: app, error, loading, setData: setApp } = useData<App>(`/api/apps/${id}`);
  const value = useMemo(() => ({ app, setApp }), [app, setApp]);

  const organization = organizations?.find((org) => org.id === app?.OrganizationId);

  const editPermission = organization && checkRole(organization.role, Permission.EditApps);
  const editMessagePermission =
    organization && checkRole(organization.role, Permission.EditAppMessages);
  const pushNotificationPermission =
    organization && checkRole(organization.role, Permission.PushNotifications);

  const resourceNames = app?.definition.resources && Object.keys(app?.definition.resources);
  const mayEditResources = Boolean(editPermission && resourceNames?.length);

  useSideMenu(
    organization && (
      <MenuSection label={app.definition.name}>
        <MenuItem exact icon="info" to={url}>
          <FormattedMessage {...messages.details} />
        </MenuItem>
        {editPermission && (
          <MenuItem icon="edit" to={`${url}/edit`}>
            <FormattedMessage {...messages.editor} />
          </MenuItem>
        )}
        {editPermission && (
          <MenuItem icon="layer-group" to={`${url}/assets`}>
            <FormattedMessage {...messages.assets} />
          </MenuItem>
        )}
        {mayEditResources && (
          <MenuItem icon="cubes" to={`${url}/resources`}>
            <FormattedMessage {...messages.resources} />
          </MenuItem>
        )}
        {mayEditResources && (
          <MenuSection>
            {resourceNames.sort().map((resource) => (
              <MenuItem key={resource} to={`${url}/resources/${resource}`}>
                {resource}
              </MenuItem>
            ))}
          </MenuSection>
        )}
        {editMessagePermission && (
          <MenuItem icon="language" to={`${url}/translations`}>
            <FormattedMessage {...messages.translations} />
          </MenuItem>
        )}
        {pushNotificationPermission && (
          <MenuItem icon="paper-plane" to={`${url}/notifications`}>
            <FormattedMessage {...messages.notifications} />
          </MenuItem>
        )}
        {editPermission && app.definition.security && (
          <MenuItem icon="users" to={`${url}/roles`}>
            <FormattedMessage {...messages.roles} />
          </MenuItem>
        )}
        {editPermission && app.definition.security && (
          <MenuItem icon="hands-helping" to={`${url}/teams`}>
            <FormattedMessage {...messages.teams} />
          </MenuItem>
        )}
        {editPermission && (
          <MenuItem icon="cogs" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        )}
        {editPermission && (
          <MenuItem icon="key" to={`${url}/secrets`}>
            <FormattedMessage {...messages.secrets} />
          </MenuItem>
        )}
      </MenuSection>
    ),
  );

  if (error) {
    return (
      <Message color="danger">
        {error.response?.status === 404 ? (
          <FormattedMessage {...messages.notFound} />
        ) : (
          <FormattedMessage {...messages.uncaughtError} />
        )}
      </Message>
    );
  }

  if (!organizations || loading) {
    return <Loader />;
  }

  return (
    <Context.Provider value={value}>
      <div className={styles.container}>
        <div className={`${styles.content} px-3 py-3`}>
          <Switch>
            <Route exact path={path}>
              <AppDetails />
            </Route>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/edit`}
              permission={Permission.EditApps}
            >
              <Editor />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${path}/assets`}
              permission={Permission.EditApps}
            >
              <Assets />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${path}/resources`}
              permission={Permission.EditApps}
            >
              <CMS />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/translations`}
              permission={Permission.EditAppMessages}
            >
              <MessageEditor />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/roles`}
              permission={Permission.EditApps}
            >
              <Roles />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/teams`}
              permission={Permission.InviteMember}
            >
              <TeamsList />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/teams/:teamId`}
              permission={Permission.InviteMember}
            >
              <TeamSettings />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/settings`}
              permission={Permission.EditAppSettings}
            >
              <AppSettings />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/notifications`}
              permission={Permission.PushNotifications}
            >
              <Notifications />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/secrets`}
              permission={Permission.EditApps}
            >
              <AppSecrets />
            </ProtectedRoute>
            <Redirect to={url} />
          </Switch>
        </div>
      </div>
    </Context.Provider>
  );
}

export function useApp(): AppValueContext {
  return useContext(Context);
}
