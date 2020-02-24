import { Loader } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { permissions } from '@appsemble/utils';
import axios from 'axios';
import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

// import useApp from '../../hooks/useApp';
import useOrganizations from '../../hooks/useOrganizations';
import AppDetails from '../AppDetails';
import AppSettings from '../AppSettings';
import AppSideMenu from '../AppSideMenu';
import CMS from '../CMS';
import Editor from '../Editor';
import Notifications from '../Notifications';
import ProtectedRoute from '../ProtectedRoute';
import Roles from '../Roles';
import styles from './AppContext.css';

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
export const AppValueContext = React.createContext(null);

export default function AppContext(): React.ReactElement {
  const match = useRouteMatch<{ id: string }>();
  const organizations = useOrganizations();
  const [app, setApp] = React.useState<App>();

  React.useEffect(() => {
    const getApp = async (): Promise<void> => {
      if (app === undefined) {
        const { data } = await axios.get<App>(`/api/apps/${match.params.id}`);
        setApp(data);
      } else if (app !== undefined) {
        // avoid unneccessary API calls
      }
    };
    getApp();
  }, [app, match.params.id]);

  const updateValue = (newAppValue: App): void => {
    setApp(newAppValue);
  };

  if (organizations === undefined || app === undefined) {
    return <Loader />;
  }

  const organization = organizations.find(org => org.id === app.OrganizationId);

  return (
    <AppValueContext.Provider value={{ app, updateValue }}>
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
    </AppValueContext.Provider>
  );
}
