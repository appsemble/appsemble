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
import { type App } from '@appsemble/types';
import { compareStrings, Permission } from '@appsemble/utils';
import classNames from 'classnames';
import {
  createContext,
  type Dispatch,
  lazy,
  type ReactNode,
  type SetStateAction,
  Suspense,
  useContext,
  useMemo,
} from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { Navigate, Route, useParams } from 'react-router-dom';

import { AssetsPage } from './assets/index.js';
import { DefinitionPage } from './definition/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { NotificationsPage } from './notifications/index.js';
import { QuotasPage } from './quotas/index.js';
import { ResourcesRoutes } from './resources/index.js';
import { SecretsPage } from './secrets/index.js';
import { SettingsPage } from './settings/index.js';
import { SnapshotsRoutes } from './snapshots/index.js';
import { TeamsRoutes } from './teams/index.js';
import { TranslationsPage } from './translations/index.js';
import { UsersPage } from './users/index.js';
import { ProtectedRoute } from '../../../components/ProtectedRoute/index.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { checkRole } from '../../../utils/checkRole.js';

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

const EditPage = lazy(() => import('./edit/index.js'));
const GuiEditorPage = lazy(() => import('./GuiEditor/index.js'));

export function AppRoutes(): ReactNode {
  const { id, lang } = useParams<{ id: string; lang: string }>();
  const url = `/${lang}/apps/${id}`;
  const { organizations } = useUser();
  const {
    data: app,
    error,
    loading,
    setData: setApp,
  } = useData<App>(`/api/apps/${id}?language=${lang}`);

  const { formatMessage } = useIntl();

  const organization = organizations?.find((org) => org.id === app?.OrganizationId);

  const editPermission = organization && checkRole(organization.role, Permission.EditApps);
  const editMessagePermission =
    organization && checkRole(organization.role, Permission.EditAppMessages);
  const pushNotificationPermission =
    organization && checkRole(organization.role, Permission.PushNotifications);

  const resourceNames = app?.definition.resources && Object.keys(app?.definition.resources);
  const mayViewResources = organization && checkRole(organization.role, Permission.ReadResources);
  const mayViewAssets = organization && checkRole(organization.role, Permission.ReadAssets);
  const canViewResources = Boolean(mayViewResources && resourceNames?.length);

  const value = useMemo(() => ({ app, setApp }), [app, setApp]);

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
        {mayViewAssets ? (
          <MenuItem icon="layer-group" to={`${url}/assets`}>
            <FormattedMessage {...messages.assets} />
          </MenuItem>
        ) : null}
        {canViewResources ? (
          <MenuItem icon="cubes" to={`${url}/resources`}>
            <FormattedMessage {...messages.resources} />
          </MenuItem>
        ) : null}
        {canViewResources ? (
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
        {editPermission ? (
          <MenuItem icon="chart-bar" to={`${url}/quotas`}>
            <FormattedMessage {...messages.quotas} />
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
        <Route element={<IndexPage />} path="/" />

        <Route
          element={<ProtectedRoute organization={organization} permission={Permission.EditApps} />}
        >
          <Route
            element={
              <Suspense fallback={<Loader />}>
                <GuiEditorPage />
              </Suspense>
            }
            path="/edit/gui/*"
          />
          <Route
            element={
              <Suspense fallback={<Loader />}>
                <EditPage />
              </Suspense>
            }
            path="/edit"
          />
          <Route element={<SecretsPage />} path="/secrets" />
          <Route element={<QuotasPage />} path="/quotas" />
          <Route element={<SnapshotsRoutes />} path="/snapshots/*" />
        </Route>

        <Route
          element={
            <ProtectedRoute organization={organization} permission={Permission.ReadAssets} />
          }
        >
          <Route element={<AssetsPage />} path="/assets" />
        </Route>

        <Route
          element={
            <ProtectedRoute organization={organization} permission={Permission.ReadResources} />
          }
        >
          <Route element={<ResourcesRoutes />} path="/resources/*" />
        </Route>

        <Route
          element={
            <ProtectedRoute organization={organization} permission={Permission.EditAppMessages} />
          }
        >
          <Route element={<TranslationsPage />} path="/translations" />
        </Route>
        {app.yaml ? <Route element={<DefinitionPage />} path="/definition" /> : null}

        {app.definition.security ? (
          <Route
            element={
              <ProtectedRoute organization={organization} permission={Permission.EditApps} />
            }
          >
            <Route element={<UsersPage />} path="/users" />
          </Route>
        ) : null}

        {app.definition.security?.teams ? (
          <Route
            element={
              <ProtectedRoute organization={organization} permission={Permission.InviteMember} />
            }
          >
            <Route element={<TeamsRoutes />} path="/teams/*" />
          </Route>
        ) : null}

        <Route
          element={
            <ProtectedRoute organization={organization} permission={Permission.EditAppSettings} />
          }
        >
          <Route element={<SettingsPage />} path="/settings" />
        </Route>

        <Route
          element={
            <ProtectedRoute organization={organization} permission={Permission.PushNotifications} />
          }
        >
          <Route element={<NotificationsPage />} path="/notifications" />
        </Route>

        <Route element={<Navigate to={url} />} path="*" />
      </MetaSwitch>
    </Context.Provider>
  );
}

export function useApp(): AppValueContext {
  return useContext(Context);
}
