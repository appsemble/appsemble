import { normalize } from '@appsemble/utils';
import React from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import AppSettings from '../AppSettings';
import Login from '../Login';
import Page from '../Page';
import { useUser } from '../UserProvider';
import styles from './Main.css';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export default function Main(): React.ReactElement {
  const { definition } = useAppDefinition();
  const { isLoggedIn } = useUser();

  if (definition == null) {
    return null;
  }

  let defaultPath;
  const routes = definition.pages.map(page => {
    const path = `/${[
      normalize(page.name),
      ...(page.parameters || []).map(parameter => `:${parameter}`),
      ...((Object.prototype.hasOwnProperty.call(page, 'subPages') && [':subPage?']) || []),
    ].join('/')}`;

    if (page.name === definition.defaultPage) {
      defaultPath = path;
    }
    return <Route key={path} exact path={path} render={props => <Page page={page} {...props} />} />;
  });

  return (
    <main className={styles.root}>
      <Switch>
        <Route component={AppSettings} exact path="/Settings" sensitive />
        {!isLoggedIn && <Route component={Login} exact path="/Login" sensitive />}
        {routes}
        <Redirect to={defaultPath} />
      </Switch>
    </main>
  );
}
