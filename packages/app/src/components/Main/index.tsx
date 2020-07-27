import { normalize } from '@appsemble/utils/src';
import React, { ReactElement } from 'react';
import { Redirect, Route, Switch } from 'react-router-dom';

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

  // The `lang` parameter for the parent route is optional. It should be required for subroutes to
  // prevent an infinite routing loop.
  return (
    <Switch>
      <Route exact path="/:lang/Settings" sensitive>
        <AppSettings />
      </Route>
      <Route exact path="/:lang/Login" sensitive>
        <Login />
      </Route>
      <Route exact path="/:lang/Callback" sensitive>
        <OpenIDCallback />
      </Route>
      <Route path="/:lang/:pageId">
        <Page />
      </Route>
      <Redirect to={`/:lang/${normalize(definition.defaultPage)}`} />
    </Switch>
  );
}
