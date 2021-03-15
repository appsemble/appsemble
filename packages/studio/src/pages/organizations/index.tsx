import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { OrganizationRoutes } from './organization';

/**
 * Render routes related to apps.
 */
export function OrganizationsRoutes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route path={`${path}/:organizationId`}>
        <OrganizationRoutes />
      </Route>
      <Redirect to={path} />
    </MetaSwitch>
  );
}
