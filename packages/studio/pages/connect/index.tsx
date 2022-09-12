import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ProtectedRoute } from '../../components/ProtectedRoute/index.js';
import { IndexPage } from './IndexPage/index.js';
import { TypePage } from './type/index.js';

export function ConnectRoutes(): ReactElement {
  const {
    params: { lang },
    path,
  } = useRouteMatch<{ lang: string }>();

  return (
    <Switch>
      <ProtectedRoute exact path={path}>
        <IndexPage />
      </ProtectedRoute>
      <Route exact path={`${path}/:type/:id`}>
        <TypePage />
      </Route>
      <Redirect to={`/${lang}/apps`} />
    </Switch>
  );
}
