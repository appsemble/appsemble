import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { BlockPage } from './block';
import { IndexPage } from './IndexPage';
import { messages } from './messages';

/**
 * Render routes related to blocks.
 */
export function BlockRoutes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route exact path={`${path}/@:organization/:blockName/:version?`}>
        <BlockPage />
      </Route>
      <Redirect to={path} />
    </MetaSwitch>
  );
}
