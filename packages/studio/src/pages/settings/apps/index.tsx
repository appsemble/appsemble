import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { DetailsPage } from './details';
import { IndexPage } from './IndexPage';
import { messages } from './messages';

export function AppsRoutes(): ReactElement {
  useMeta(messages.title);
  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route exact path={`${path}/:appId`}>
        <DetailsPage />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}