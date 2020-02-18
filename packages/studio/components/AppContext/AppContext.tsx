import { Loader } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { permissions } from '@appsemble/utils';
import axios from 'axios';
import React, { createContext } from 'react';
import { Redirect, Route, Switch, useParams, useRouteMatch } from 'react-router-dom';

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
  const app = useApp();
  const [ready, setReady] = React.useState<boolean>([]);

  if (organizations === undefined || app === undefined) {
    return <Loader />;
  }
  const organization = organizations.find(org => org.id === app.OrganizationId);

  return (
    <div className={styles.container}>
      <AppSideMenu />
      <div className={styles.content}>
        <Switch>
          <Route component={AppDetails} exact path={match.path} />
          <ProtectedRoute
            component={Editor}
            exact
            organization={organization}
            path={`${match.path}/edit`}
            permission={permissions.EditApps}
          />
          <ProtectedRoute
            component={CMS}
            organization={organization}
            path={`${match.path}/resources`}
            permission={permissions.EditApps}
          />
          <ProtectedRoute
            component={Roles}
            exact
            organization={organization}
            path={`${match.path}/roles`}
            permission={permissions.EditApps}
          />
          <ProtectedRoute
            component={() => <AppSettings apps={app} match={match} />}
            exact
            organization={organization}
            path={`${match.path}/settings`}
            permission={permissions.EditAppSettings}
          />
          <ProtectedRoute
            component={Notifications}
            exact
            organization={organization}
            path={`${match.path}/notifications`}
            permission={permissions.PushNotifications}
          />
          <Redirect to={match.path} />
        </Switch>
      </div>
    </div>
  );
}
