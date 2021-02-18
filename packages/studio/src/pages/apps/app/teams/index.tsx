import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './Index';
import { messages } from './messages';

export function TeamsRoutes(): ReactElement {
  useMeta(messages.title);

  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
