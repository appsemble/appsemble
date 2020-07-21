import React, { ReactElement } from 'react';
import { Route, Switch } from 'react-router-dom';

import { useAppDefinition } from '../AppDefinitionProvider';
import AppSettings from '../AppSettings';
import Login from '../Login';
import OpenIDCallback from '../OpenIDCallback';
import Page from '../Page';

/**
 * The main body of the loaded app.
 *
 * This maps the page to a route and displays a page depending on URL.
 */
export default function Main(): ReactElement {
  const { definition } = useAppDefinition();

  if (definition == null) {
    return null;
  }

  return (
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
      <Route path="/:pageId?">
        <Page />
      </Route>
    </Switch>
  );
}
