import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { TeamPage } from './team';

export function TeamsRoutes(): ReactElement {
  useMeta(messages.title);

  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route exact path={`${path}/:teamId`}>
        <TeamPage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
