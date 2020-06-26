import { normalize } from '@appsemble/utils';
import React from 'react';
import { Redirect, Route, Switch, useLocation } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import AppSettings from '../AppSettings';
import Login from '../Login';
import OpenIDCallback from '../OpenIDCallback';
import Page from '../Page';
import styles from './index.css';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export default function Main(): React.ReactElement {
  const { definition } = useAppDefinition();
  const location = useLocation();

  if (definition == null) {
    return null;
  }

  let defaultPath;
  const routes = definition.pages.map((page, index) => {
    const path = `/${[
      normalize(page.name),
      ...(page.parameters || []).map((parameter) => `:${parameter}`),
      ...((Object.prototype.hasOwnProperty.call(page, 'subPages') && [':subPage?']) || []),
    ].join('/')}`;

    if (page.name === definition.defaultPage) {
      defaultPath = path;
    }

    return (
      <Route key={path} exact path={path}>
        <Page page={page} prefix={`pages.${index}`} />
      </Route>
    );
  });

  const [currentPageName] = location.pathname.slice(1).split('/');
  const currentPage = definition.pages.find((p) => normalize(p.name) === currentPageName);
  const currentPageIndex = currentPageName && definition.pages.indexOf(currentPage);
  const path = currentPageIndex === -1 ? currentPageName : `pages.${currentPageIndex}`;

  return (
    <main className={styles.root} data-path={path}>
      <Switch>
        <Route exact path="/Settings" sensitive>
          <AppSettings />
        </Route>
        <Route exact path="/Login" sensitive>
          <Login />
        </Route>
        <Route exact path="/Callback" sensitive>
          <OpenIDCallback />
        </Route>
        {routes}
        <Redirect to={defaultPath} />
      </Switch>
    </main>
  );
}
