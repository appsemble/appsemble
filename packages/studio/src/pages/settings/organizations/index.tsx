import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './Index';
import { OrganizationPage } from './organization';

/**
 * Handle the organization settings routes.
 */
export function OrganizationsRoutes(): ReactElement {
  const { url } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={url}>
        <IndexPage />
      </Route>
      <Route path={`${url}/:organizationId`}>
        <OrganizationPage />
      </Route>
      <Redirect to={url} />
    </Switch>
  );
}
