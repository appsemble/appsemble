import { ReactElement } from 'react';
import { Redirect, Route, Switch, useRouteMatch } from 'react-router-dom';

import { ProtectedRoute } from '../../components/ProtectedRoute';
import { IndexPage } from './IndexPage';
import { TypePage } from './type';

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
