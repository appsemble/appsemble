import { normalize } from '@appsemble/utils';
import PropTypes from 'prop-types';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import settings from '../../utils/settings';
import AppSettings from '../AppSettings';
import Login from '../Login';
import Page from '../Page';
import { useServiceWorkerRegistration } from '../ServiceWorkerRegistrationProvider';
import styles from './Main.css';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export default function Main({ definition = null, user }) {
  const pushNotifications = useServiceWorkerRegistration();

  if (definition == null) {
    return null;
  }

  let defaultPath;
  const routes = definition.pages.map(page => {
    const path = `/${[
      normalize(page.name),
      ...(page.parameters || []).map(parameter => `:${parameter}`),
      ...((page.subPages && [':subPage?']) || []),
    ].join('/')}`;

    if (page.name === definition.defaultPage) {
      defaultPath = path;
    }
    return (
      <Route
        key={path}
        exact
        path={path}
        render={props => (
          <Page appId={settings.id} page={page} pushNotifications={pushNotifications} {...props} />
        )}
      />
    );
  });

  return (
    <main className={styles.root}>
      <Switch>
        <Route component={AppSettings} exact path="/Settings" sensitive />
        {!user && <Route component={Login} exact path="/Login" sensitive />}
        {routes}
        <Redirect to={defaultPath} />
      </Switch>
    </main>
  );
}

Main.propTypes = {
  // eslint-disable-next-line react/require-default-props
  definition: PropTypes.shape(),
  user: PropTypes.shape().isRequired,
};
