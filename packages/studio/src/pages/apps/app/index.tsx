import {
  Icon,
  Loader,
  MenuItem,
  MenuSection,
  Message,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { compareStrings, Permission } from '@appsemble/utils';
import classNames from 'classnames';
import {
  createContext,
  Dispatch,
  lazy,
  ReactElement,
  SetStateAction,
  Suspense,
  useContext,
  useMemo,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { ProtectedRoute } from '../../../components/ProtectedRoute';
import { useUser } from '../../../components/UserProvider';
import { checkRole } from '../../../utils/checkRole';
import { AssetsPage } from './assets';
import { DefinitionPage } from './definition';
import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { NotificationsPage } from './notifications';
import { ResourcesRoutes } from './resources';
import { SecretsPage } from './secrets';
import { SettingsPage } from './settings';
import { SnapshotsRoutes } from './snapshots';
import { TeamsRoutes } from './teams';
import { TranslationsPage } from './translations';
import { UsersPage } from './users';

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

const EditPage = lazy(() => import('./edit'));

export function AppRoutes(): ReactElement {
  const {
    params: { id, lang },
    path,
    url,
  } = useRouteMatch<{ id: string; lang: string }>();
  const { organizations } = useUser();
  const {
    data: app,
    error,
    loading,
    setData: setApp,
  } = useData<App>(`/api/apps/${id}?language=${lang}`);
  const value = useMemo(() => ({ app, setApp }), [app, setApp]);
  const { formatMessage } = useIntl();

  const organization = organizations?.find((org) => org.id === app?.OrganizationId);

  const editPermission = organization && checkRole(organization.role, Permission.EditApps);
  const editMessagePermission =
    organization && checkRole(organization.role, Permission.EditAppMessages);
  const pushNotificationPermission =
    organization && checkRole(organization.role, Permission.PushNotifications);

  const resourceNames = app?.definition.resources && Object.keys(app?.definition.resources);
  const mayEditResources = Boolean(editPermission && resourceNames?.length);

  useSideMenu(
    app && (
      <MenuSection
        label={
          <>
            {app.locked ? <Icon icon="lock" title={formatMessage(messages.locked)} /> : null}
            <span className={classNames({ 'pl-1': !app.locked })}>{app.definition.name}</span>
          </>
        }
      >
        <MenuItem exact icon="info" to={url}>
          <FormattedMessage {...messages.details} />
        </MenuItem>
        {editPermission ? (
          <MenuItem icon="edit" to={`${url}/edit`}>
            <FormattedMessage {...messages.editor} />
          </MenuItem>
        ) : app.yaml ? (
          <MenuItem icon="code" to={`${url}/definition`}>
            <FormattedMessage {...messages.definition} />
          </MenuItem>
        ) : null}
        {editPermission ? (
          <MenuItem icon="layer-group" to={`${url}/assets`}>
            <FormattedMessage {...messages.assets} />
          </MenuItem>
        ) : null}
        {mayEditResources ? (
          <MenuItem icon="cubes" to={`${url}/resources`}>
            <FormattedMessage {...messages.resources} />
          </MenuItem>
        ) : null}
        {mayEditResources ? (
          <MenuSection>
            {resourceNames.sort(compareStrings).map((resource) => (
              <MenuItem key={resource} to={`${url}/resources/${resource}`}>
                {resource}
              </MenuItem>
            ))}
          </MenuSection>
        ) : null}
        {editMessagePermission ? (
          <MenuItem icon="language" to={`${url}/translations`}>
            <FormattedMessage {...messages.translations} />
          </MenuItem>
        ) : null}
        {pushNotificationPermission ? (
          <MenuItem icon="paper-plane" to={`${url}/notifications`}>
            <FormattedMessage {...messages.notifications} />
          </MenuItem>
        ) : null}
        {editPermission && app.definition.security ? (
          <MenuItem icon="users" to={`${url}/users`}>
            <FormattedMessage {...messages.users} />
          </MenuItem>
        ) : null}
        {editPermission && app.definition.security?.teams ? (
          <MenuItem icon="hands-helping" to={`${url}/teams`}>
            <FormattedMessage {...messages.teams} />
          </MenuItem>
        ) : null}
        {editPermission ? (
          <MenuItem icon="clock" to={`${url}/snapshots`}>
            <FormattedMessage {...messages.snapshots} />
          </MenuItem>
        ) : null}
        {editPermission ? (
          <MenuItem icon="cogs" to={`${url}/settings`}>
            <FormattedMessage {...messages.settings} />
          </MenuItem>
        ) : null}
        {editPermission ? (
          <MenuItem icon="key" to={`${url}/secrets`}>
            <FormattedMessage {...messages.secrets} />
          </MenuItem>
        ) : null}
      </MenuSection>
    ),
  );

  if (error) {
    return (
      <Message color="danger">
        {error.response?.status === 404 ? (
          <FormattedMessage {...messages.notFound} />
        ) : error.response?.status === 401 ? (
          <FormattedMessage {...messages.permissionError} />
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
      <MetaSwitch
        description={app.messages?.app?.description || app.definition.description}
        title={app.messages?.app?.name || app.definition.name}
      >
        <Route exact path={path}>
          <IndexPage />
        </Route>
        <ProtectedRoute
          exact
          organization={organization}
          path={`${path}/edit`}
          permission={Permission.EditApps}
        >
          <Suspense fallback={<Loader />}>
            <EditPage />
          </Suspense>
        </ProtectedRoute>
        {app.yaml ? (
          <Route path={`${path}/definition`}>
            <DefinitionPage />
          </Route>
        ) : null}
        <ProtectedRoute
          organization={organization}
          path={`${path}/assets`}
          permission={Permission.ReadAssets}
        >
          <AssetsPage />
        </ProtectedRoute>
        <ProtectedRoute
          organization={organization}
          path={`${path}/resources`}
          permission={Permission.ReadResources}
        >
          <ResourcesRoutes />
        </ProtectedRoute>
        <ProtectedRoute
          exact
          organization={organization}
          path={`${path}/translations`}
          permission={Permission.EditAppMessages}
        >
          <TranslationsPage />
        </ProtectedRoute>
        {app.definition.security ? (
          <ProtectedRoute
            exact
            organization={organization}
            path={`${path}/users`}
            permission={Permission.ManageRoles}
          >
            <UsersPage />
          </ProtectedRoute>
        ) : null}
        {app.definition.security?.teams ? (
          <ProtectedRoute
            organization={organization}
            path={`${path}/teams`}
            permission={Permission.InviteMember}
          >
            <TeamsRoutes />
          </ProtectedRoute>
        ) : null}
        <ProtectedRoute
          exact
          organization={organization}
          path={`${path}/settings`}
          permission={Permission.EditAppSettings}
        >
          <SettingsPage />
        </ProtectedRoute>
        <ProtectedRoute
          exact
          organization={organization}
          path={`${path}/notifications`}
          permission={Permission.PushNotifications}
        >
          <NotificationsPage />
        </ProtectedRoute>
        <ProtectedRoute
          exact
          organization={organization}
          path={`${path}/secrets`}
          permission={Permission.EditApps}
        >
          <SecretsPage />
        </ProtectedRoute>
        <ProtectedRoute
          organization={organization}
          path={`${path}/snapshots`}
          permission={Permission.EditApps}
        >
          <SnapshotsRoutes />
        </ProtectedRoute>
        <Redirect to={url} />
      </MetaSwitch>
    </Context.Provider>
  );
}

export function useApp(): AppValueContext {
  return useContext(Context);
}
