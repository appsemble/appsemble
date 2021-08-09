import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { ActionPage } from './action';
import { AppPage } from './app';
import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { RemapperPage } from './remapper';

export function ReferenceRoutes(): ReactElement {
  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route exact path={`${path}/app`}>
        <AppPage />
      </Route>
      <Route exact path={`${path}/action`}>
        <ActionPage />
      </Route>
      <Route exact path={`${path}/remapper`}>
        <RemapperPage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
