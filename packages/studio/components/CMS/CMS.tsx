import React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import CMSRoot from '../CMSRoot';
import ResourceTable from '../ResourceTable';

export default function CMS(): React.ReactElement {
  const match = useRouteMatch();

  return (
    <Switch>
      <Route component={CMSRoot} exact path={match.path} />
      <Route component={ResourceTable} path={`${match.path}/:resourceName/:mode?/:resourceId?`} />
      <Redirect to={match.path} />
    </Switch>
  );
}
