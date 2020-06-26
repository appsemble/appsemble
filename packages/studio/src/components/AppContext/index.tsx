import { Loader, Message, useData } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import AppDetails from '../AppDetails';
import AppSecrets from '../AppSecrets';
import AppSettings from '../AppSettings';
import AppSideMenu from '../AppSideMenu';
import Assets from '../Assets';
import CMS from '../CMS';
import Editor from '../Editor';
import Notifications from '../Notifications';
import ProtectedRoute from '../ProtectedRoute';
import Roles from '../Roles';
import styles from './index.css';
import messages from './messages';

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
  setApp: (app: App) => void;
}

const Context = React.createContext<AppValueContext>(null);

export default function AppContext(): React.ReactElement {
  const match = useRouteMatch<{ id: string }>();
  const organizations = useOrganizations();
  const { data: app, error, loading, setData: setApp } = useData<App>(
    `/api/apps/${match.params.id}`,
  );
  const value = React.useMemo(() => ({ app, setApp }), [app, setApp]);

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

  const organization = organizations.find((org) => org.id === app.OrganizationId);

  return (
    <Context.Provider value={value}>
      <div className={styles.container}>
        <AppSideMenu />
        <div className={`${styles.content} px-3 py-3`}>
          <Switch>
            <Route exact path={match.path}>
              <AppDetails />
            </Route>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/edit`}
              permission={Permission.EditApps}
            >
              <Editor />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${match.path}/assets`}
              permission={Permission.EditApps}
            >
              <Assets />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${match.path}/resources`}
              permission={Permission.EditApps}
            >
              <CMS />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/roles`}
              permission={Permission.EditApps}
            >
              <Roles />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/settings`}
              permission={Permission.EditAppSettings}
            >
              <AppSettings />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/notifications`}
              permission={Permission.PushNotifications}
            >
              <Notifications />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/secrets`}
              permission={Permission.EditApps}
            >
              <AppSecrets />
            </ProtectedRoute>
            <Redirect to={match.path} />
          </Switch>
        </div>
      </div>
    </Context.Provider>
  );
}

export function useApp(): AppValueContext {
  return React.useContext(Context);
}
