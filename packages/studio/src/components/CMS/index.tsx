import * as React from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import CMSRoot from '../CMSRoot';
import ResourceTable from '../ResourceTable';

export default function CMS(): React.ReactElement {
  const match = useRouteMatch();

  return (
    <Switch>
      <Route exact path={match.path}>
        <CMSRoot />
      </Route>
      <Route path={`${match.path}/:resourceName/:mode?/:resourceId?`}>
        <ResourceTable />
      </Route>
      <Redirect to={match.path} />
    </Switch>
  );
}
