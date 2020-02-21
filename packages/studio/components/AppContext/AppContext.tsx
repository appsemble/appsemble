import { Loader } from '@appsemble/react-components';
import { permissions } from '@appsemble/utils';
import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import useApp from '../../hooks/useApp';
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
export default function AppContext(): React.ReactElement {
  const match = useRouteMatch<{ id: string }>();
  const organizations = useOrganizations();
  const { app } = useApp();

  if (organizations === undefined || app === undefined) {
    return <Loader />;
  }

  const organization = organizations.find(org => org.id === app.OrganizationId);

  return (
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
  );
}
