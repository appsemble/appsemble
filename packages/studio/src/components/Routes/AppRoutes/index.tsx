import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { AppContext } from '../../AppContext';
import { AppList } from '../../AppList';
import { messages } from './messages';

/**
 * Render routes related to apps.
 */
export function AppRoutes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <AppList />
      </Route>
      <Route path={`${path}/:id(\\d+)`}>
        <AppContext />
      </Route>
      <Redirect to={path} />
    </MetaSwitch>
  );
}
