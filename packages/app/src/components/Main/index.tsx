import { normalize } from '@appsemble/utils/src';
import React, { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

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
  const { path } = useRouteMatch();

  if (definition == null) {
    return null;
  }

  return (
    <Switch>
      <Route exact path={`${path}/Settings`} sensitive>
        <AppSettings />
      </Route>
      <Route exact path={`${path}/Login`} sensitive>
        <Login />
      </Route>
      <Route exact path={`${path}/Callback`} sensitive>
        <OpenIDCallback />
      </Route>
      <Route path={`${path}/:pageId`}>
        <Page />
      </Route>
      <Redirect to={`${path}/${normalize(definition.defaultPage)}`} />
    </Switch>
  );
}
