import { Loader, Message, useData } from '@appsemble/react-components';
import { App } from '@appsemble/types';
import { Permission } from '@appsemble/utils';
import React, { createContext, ReactElement, useContext, useMemo } from 'react';
import { FormattedMessage } from 'react-intl';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { AppDetails } from '../AppDetails';
import { AppSecrets } from '../AppSecrets';
import { AppSettings } from '../AppSettings';
import { AppSideMenu } from '../AppSideMenu';
import { Assets } from '../Assets';
import { CMS } from '../CMS';
import { Editor } from '../Editor';
import { MessageEditor } from '../MessageEditor';
import { Notifications } from '../Notifications';
import { ProtectedRoute } from '../ProtectedRoute';
import { Roles } from '../Roles';
import { useUser } from '../UserProvider';
import styles from './index.css';
import { messages } from './messages';

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

const Context = createContext<AppValueContext>(null);

export function AppContext(): ReactElement {
  const {
    params: { id },
    path,
    url,
  } = useRouteMatch<{ id: string }>();
  const { organizations } = useUser();
  const { data: app, error, loading, setData: setApp } = useData<App>(`/api/apps/${id}`);
  const value = useMemo(() => ({ app, setApp }), [app, setApp]);

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
            <Route exact path={path}>
              <AppDetails />
            </Route>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/edit`}
              permission={Permission.EditApps}
            >
              <Editor />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${path}/assets`}
              permission={Permission.EditApps}
            >
              <Assets />
            </ProtectedRoute>
            <ProtectedRoute
              organization={organization}
              path={`${path}/resources`}
              permission={Permission.EditApps}
            >
              <CMS />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/translations`}
              permission={Permission.EditAppMessages}
            >
              <MessageEditor />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/roles`}
              permission={Permission.EditApps}
            >
              <Roles />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/settings`}
              permission={Permission.EditAppSettings}
            >
              <AppSettings />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/notifications`}
              permission={Permission.PushNotifications}
            >
              <Notifications />
            </ProtectedRoute>
            <ProtectedRoute
              exact
              organization={organization}
              path={`${path}/secrets`}
              permission={Permission.EditApps}
            >
              <AppSecrets />
            </ProtectedRoute>
            <Redirect to={url} />
          </Switch>
        </div>
      </div>
    </Context.Provider>
  );
}

export function useApp(): AppValueContext {
  return useContext(Context);
}
