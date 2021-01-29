import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { CMSRoot } from '../CMSRoot';
import { ResourceTable } from '../ResourceTable';

export function CMS(): ReactElement {
  const { path, url } = useRouteMatch();

  return (
    <Switch>
      <Route exact path={path}>
        <CMSRoot />
      </Route>
      <Route path={`${path}/:resourceName`}>
        <ResourceTable />
      </Route>
      <Redirect to={url} />
    </Switch>
  );
}
