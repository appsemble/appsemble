import { Loader } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { permissions } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import AppDetails from '../AppDetails';
import AppSettings from '../AppSettings';
import AppSideMenu from '../AppSideMenu';
import CMS from '../CMS';
import Editor from '../Editor';
import Notifications from '../Notifications';
import ProtectedRoute from '../ProtectedRoute';
import Roles from '../Roles';
import styles from './index.css';

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
  const [app, setApp] = React.useState<App>();
  const value = React.useMemo(() => ({ app, setApp }), [app]);

  React.useEffect(() => {
    const getApp = async (): Promise<void> => {
      setApp(undefined);
      const { data } = await axios.get<App>(`/api/apps/${match.params.id}`);
      setApp(data);
    };
    getApp();
  }, [match]);

  if (organizations === undefined || app === undefined) {
    return <Loader />;
  }

  const organization = organizations.find((org) => org.id === app.OrganizationId);

  return (
    <Context.Provider value={value}>
      <div className={styles.container}>
        <AppSideMenu />
        <div className={styles.content}>
          <Switch>
            <Route exact path={match.path}>
              <AppDetails />
            </Route>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/edit`}
              permission={permissions.EditApps}
            >
              <Editor />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${match.path}/resources`}
              permission={permissions.EditApps}
            >
              <CMS />
            </ProtectedRoute>
            <ProtectedRoute
              component={Roles}
              exact
              organization={organization}
              path={`${match.path}/roles`}
              permission={permissions.EditApps}
            />
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/settings`}
              permission={permissions.EditAppSettings}
            >
              <AppSettings />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/notifications`}
              permission={permissions.PushNotifications}
            >
              <Notifications />
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
