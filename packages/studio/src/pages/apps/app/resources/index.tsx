import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './Index';
import { messages } from './messages';
import { ResourcePage } from './resource';

export function ResourcesRoutes(): ReactElement {
  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/:resourceName`}>
        <ResourcePage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
