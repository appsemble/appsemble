import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './IndexPage';
import { ResourceDefinitionDetailsPage } from './resource-definition-details';
import { ResourceDetailsPage } from './resource-details';

export function ResourceRoutes(): ReactElement {
  const { params, path, url } = useRouteMatch<{ resourceName: string }>();

  return (
    <MetaSwitch title={params.resourceName}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/details`}>
        <ResourceDefinitionDetailsPage />
      </Route>
      <Route path={`${path}/:resourceId(\\d+)`}>
        <ResourceDetailsPage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
