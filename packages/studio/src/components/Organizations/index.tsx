import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { OrganizationSettings } from '../OrganizationSettings';
import { OrganizationsList } from '../OrganizationsList';

/**
 * Handle the organization settings routes.
 */
export function Organizations(): ReactElement {
  const { url } = useRouteMatch();

  return (
    <Switch>
      <Route component={OrganizationsList} exact path={url} />
      <Route component={OrganizationSettings} path={`${url}/:organizationId`} />
      <Redirect to={url} />
    </Switch>
  );
}
