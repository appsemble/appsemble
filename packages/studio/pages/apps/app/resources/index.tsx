import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { ResourceRoutes } from './resource/index.js';

export function ResourcesRoutes(): ReactElement {
  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/:resourceName`}>
        <ResourceRoutes />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
