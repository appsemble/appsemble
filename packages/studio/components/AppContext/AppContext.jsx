import { Loader } from '@appsemble/react-components';
import { permissions } from '@appsemble/utils';
import PropTypes from 'prop-types';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import AppDetails from '../AppDetails';
import AppSettings from '../AppSettings';
import AppSideMenu from '../AppSideMenu';
import CMS from '../CMS';
import Editor from '../Editor';
import Notifications from '../Notifications';
import ProtectedRoute from '../ProtectedRoute';
import styles from './AppContext.css';

/**
 * A wrapper which fetches the app definition and makes sure it is available to its children.
 */
function AppContext({ app = undefined, match, getApp, initAuth, ready }) {
  React.useEffect(() => {
    const initApp = async () => {
      await initAuth();
      await getApp(match.params.id);
    };

    initApp();
  }, [getApp, initAuth, match.params.id]);

  const organizations = useOrganizations();

  if (!ready) {
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
            component={AppSettings}
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

AppContext.propTypes = {
  // eslint-disable-next-line react/require-default-props
  app: PropTypes.shape(),
  getApp: PropTypes.func.isRequired,
  initAuth: PropTypes.func.isRequired,
  match: PropTypes.shape().isRequired,
  ready: PropTypes.bool.isRequired,
};

export default AppContext;
