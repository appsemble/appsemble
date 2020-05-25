import { Loader, Message } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import { permissions } from '@appsemble/utils';
import axios, { AxiosError } from 'axios';
import React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import useOrganizations from '../../hooks/useOrganizations';
import AppDetails from '../AppDetails';
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
  const [app, setApp] = React.useState<App>();
  const [error, setError] = React.useState<MessageDescriptor>();
  const value = React.useMemo(() => ({ app, setApp }), [app]);

  React.useEffect(() => {
    const getApp = async (): Promise<void> => {
      setApp(undefined);
      try {
        const { data } = await axios.get<App>(`/api/apps/${match.params.id}`);
        setApp(data);
      } catch (err) {
        setError(
          (err as AxiosError)?.response?.status === 404
            ? messages.notFound
            : messages.uncaughtError,
        );
      }
    };
    getApp();
  }, [match]);

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...error} />
      </Message>
    );
  }

  if (!organizations || !app) {
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
              path={`${match.path}/assets`}
              permission={permissions.EditApps}
            >
              <Assets />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${match.path}/resources`}
              permission={permissions.EditApps}
            >
              <CMS />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${match.path}/roles`}
              permission={permissions.EditApps}
            >
              <Roles />
            </ProtectedRoute>
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
