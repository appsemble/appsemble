import {
  CollapsibleMenuSection,
  Icon,
  Loader,
  MenuItem,
  MenuSection,
  Message,
  MetaSwitch,
  useData,
  useSideMenu,
} from '@appsemble/react-components';
import { type App, OrganizationPermission, PredefinedOrganizationRole } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions, compareStrings } from '@appsemble/utils';
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
import { ContainerLogs } from './containerLogs/index.js';
import { DefinitionPage } from './definition/index.js';
import { GroupsRoutes } from './groups/index.js';
import { IndexPage } from './IndexPage/index.js';
import { MembersPage } from './members/index.js';
import { messages } from './messages.js';
import { NotificationsPage } from './notifications/index.js';
import { QuotasPage } from './quotas/index.js';
import { ResourcesRoutes } from './resources/index.js';
import { SecretsPage } from './secrets/index.js';
import { SettingsPage } from './settings/index.js';
import { SnapshotsRoutes } from './snapshots/index.js';
import { TranslationsPage } from './translations/index.js';
import { VariablesPage } from './variables/index.js';
import { ProtectedRoute } from '../../../components/ProtectedRoute/index.js';
import { useUser } from '../../../components/UserProvider/index.js';

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
  const {
    '*': splat,
    id,
    lang,
    path,
  } = useParams<{ id: string; lang: string; path?: string; '*': string }>();
  const { organizations } = useUser();

  const {
    data: app,
    error,
    loading,
    setData: setApp,
  } = useData<App>(`/api/apps/${id}?language=${lang}`);

  const url = `apps/${id}/${path}`;

  const { formatMessage } = useIntl();

  const resourceNames = app?.definition.resources && Object.keys(app?.definition.resources);

  const organization = useMemo(
    () => organizations?.find((org) => org.id === app?.OrganizationId),
    [app, organizations],
  );

  const userOrganizationRole = useMemo(
    () => organization?.role || PredefinedOrganizationRole.Member,
    [organization],
  );

  const mayVisitEditor = useMemo(
    () =>
      organization &&
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.UpdateApps,
      ]),
    [userOrganizationRole, organization],
  );

  const mayVisitAssets = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppAssets,
      ]),
    [userOrganizationRole],
  );

  const mayVisitResources = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppResources,
      ]),
    [userOrganizationRole],
  );

  const mayVisitTranslations = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppMessages,
      ]),
    [userOrganizationRole],
  );

  const mayVisitNotifications = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.PushAppNotifications,
      ]),
    [userOrganizationRole],
  );

  const mayVisitAppMembers = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppMembers,
      ]),
    [userOrganizationRole],
  );

  const mayVisitGroups = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryGroups,
      ]),
    [userOrganizationRole],
  );

  const mayVisitSnapshots = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppSnapshots,
      ]),
    [userOrganizationRole],
  );

  const mayVisitSettings = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.ReadAppSettings,
      ]),
    [userOrganizationRole],
  );

  const mayVisitVariables = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppVariables,
      ]),
    [userOrganizationRole],
  );

  const mayVisitSecrets = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.QueryAppSecrets,
      ]),
    [userOrganizationRole],
  );

  const mayVisitQuotas = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.ReadAppSettings,
      ]),
    [userOrganizationRole],
  );

  const mayVisitContainerLogs = useMemo(
    () =>
      checkOrganizationRoleOrganizationPermissions(userOrganizationRole, [
        OrganizationPermission.UpdateApps,
      ]),
    [userOrganizationRole],
  );

  const value = useMemo(() => ({ app, setApp }), [app, setApp]);

  useSideMenu(
    app && (
      <MenuSection
        label={
          <>
            {app.locked === 'unlocked' ? null : (
              <Icon icon="lock" title={formatMessage(messages.locked)} />
            )}
            <span
              className={classNames({ 'pl-1': app.locked === 'unlocked' })}
              data-testid="studio-app-side-menu-name"
            >
              {app.definition.name}
            </span>
          </>
        }
        testId="studio-app-side-menu"
      >
        <MenuItem end icon="info" to={url}>
          <FormattedMessage {...messages.details} />
        </MenuItem>
        {mayVisitEditor ? (
          <MenuItem icon="edit" to={`${url}/edit#editor`}>
            <FormattedMessage {...messages.editor} />
          </MenuItem>
        ) : app.yaml ? (
          <MenuItem icon="code" to={`${url}/definition`}>
            <FormattedMessage {...messages.definition} />
          </MenuItem>
        ) : null}

        {organization ? (
          <>
            {mayVisitAssets ? (
              <MenuItem icon="layer-group" to={`${url}/assets`}>
                <FormattedMessage {...messages.assets} />
              </MenuItem>
            ) : null}

            {mayVisitResources && resourceNames?.length ? (
              <CollapsibleMenuSection>
                <MenuItem icon="cubes" to={`${url}/resources`}>
                  <FormattedMessage {...messages.resources} />
                </MenuItem>
                <MenuSection>
                  {resourceNames.sort(compareStrings).map((resource) => (
                    <MenuItem key={resource} to={`${url}/resources/${resource}`}>
                      {resource}
                    </MenuItem>
                  ))}
                </MenuSection>
              </CollapsibleMenuSection>
            ) : null}

            {mayVisitTranslations ? (
              <MenuItem icon="language" to={`${url}/translations`}>
                <FormattedMessage {...messages.translations} />
              </MenuItem>
            ) : null}

            {mayVisitNotifications ? (
              <MenuItem icon="paper-plane" to={`${url}/notifications`}>
                <FormattedMessage {...messages.notifications} />
              </MenuItem>
            ) : null}

            {mayVisitAppMembers && app.definition.security ? (
              <MenuItem icon="users" to={`${url}/members`}>
                <FormattedMessage {...messages.users} />
              </MenuItem>
            ) : null}

            {mayVisitGroups && app.definition.security ? (
              <MenuItem icon="hands-helping" to={`${url}/groups`}>
                <FormattedMessage {...messages.groups} />
              </MenuItem>
            ) : null}

            {mayVisitSnapshots ? (
              <MenuItem icon="clock" to={`${url}/snapshots`}>
                <FormattedMessage {...messages.snapshots} />
              </MenuItem>
            ) : null}

            {mayVisitSettings ? (
              <MenuItem icon="cogs" to={`${url}/settings`}>
                <FormattedMessage {...messages.settings} />
              </MenuItem>
            ) : null}

            {mayVisitVariables ? (
              <MenuItem icon="code" to={`${url}/variables`}>
                <FormattedMessage {...messages.variables} />
              </MenuItem>
            ) : null}

            {mayVisitSecrets ? (
              <MenuItem icon="key" to={`${url}/secrets`}>
                <FormattedMessage {...messages.secrets} />
              </MenuItem>
            ) : null}

            {mayVisitQuotas ? (
              <MenuItem icon="chart-bar" to={`${url}/quotas`}>
                <FormattedMessage {...messages.quotas} />
              </MenuItem>
            ) : null}
          </>
        ) : null}
        {mayVisitContainerLogs && app.definition?.containers ? (
          <MenuItem icon="list-alt" to={`${url}/container-logs`}>
            <FormattedMessage {...messages.logs} />
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

  if (path === undefined) {
    /* For compatibility with old app links, see #1490 */
    return <Navigate replace to={`/${lang}/apps/${id}/${app.path}`} />;
  }

  if (app && app.path !== path) {
    return <Navigate replace to={`/${lang}/apps/${id}/${app.path}/${splat}`} />;
  }

  return (
    <Context.Provider value={value}>
      <MetaSwitch
        description={app.messages?.app?.description || app.definition.description}
        title={app.messages?.app?.name || app.definition.name}
      >
        <Route element={<IndexPage />} path="/" />

        {app.yaml ? <Route element={<DefinitionPage />} path="/definition" /> : null}

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.UpdateApps]}
            />
          }
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
        </Route>

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.QueryAppAssets]}
            />
          }
        >
          <Route element={<AssetsPage />} path="/assets" />
        </Route>

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.QueryAppResources]}
            />
          }
        >
          <Route element={<ResourcesRoutes />} path="/resources/*" />
        </Route>

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.QueryAppMessages]}
            />
          }
        >
          <Route element={<TranslationsPage />} path="/translations" />
        </Route>
        {app.definition?.containers ? (
          <Route
            element={
              <ProtectedRoute
                organization={organization}
                permissions={[OrganizationPermission.QueryAppResources]}
              />
            }
          >
            <Route element={<ContainerLogs />} path="/container-logs" />
          </Route>
        ) : null}

        {app.yaml ? <Route element={<DefinitionPage />} path="/definition" /> : null}

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.PushAppNotifications]}
            />
          }
        >
          <Route element={<NotificationsPage />} path="/notifications" />
        </Route>

        {app.definition.security ? (
          <>
            <Route
              element={
                <ProtectedRoute
                  organization={organization}
                  permissions={[OrganizationPermission.QueryAppMembers]}
                />
              }
            >
              <Route element={<MembersPage />} path="/members" />
            </Route>

            <Route
              element={
                <ProtectedRoute
                  organization={organization}
                  permissions={[OrganizationPermission.QueryGroups]}
                />
              }
            >
              <Route element={<GroupsRoutes />} path="/groups/*" />
            </Route>
          </>
        ) : null}

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.ReadAppSettings]}
            />
          }
        >
          <Route element={<SnapshotsRoutes />} path="/snapshots/*" />
          <Route element={<QuotasPage />} path="/quotas" />
        </Route>

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.UpdateAppSettings]}
            />
          }
        >
          <Route element={<SettingsPage />} path="/settings" />
        </Route>

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.QueryAppVariables]}
            />
          }
        >
          <Route element={<VariablesPage />} path="/variables" />
        </Route>

        <Route
          element={
            <ProtectedRoute
              organization={organization}
              permissions={[OrganizationPermission.QueryAppSecrets]}
            />
          }
        >
          <Route element={<SecretsPage />} path="/secrets" />
        </Route>

        <Route element={<Navigate to={url} />} path="*" />
      </MetaSwitch>
    </Context.Provider>
  );
}

export function useApp(): AppValueContext {
  return useContext(Context);
}
