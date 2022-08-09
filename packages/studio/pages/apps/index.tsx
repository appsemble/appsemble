import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AppRoutes } from './app/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

/**
 * Render routes related to apps.
 */
export function AppsRoutes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/:id(\\d+)`}>
        <AppRoutes />
      </Route>
      <Redirect to={path} />
    </MetaSwitch>
  );
}
