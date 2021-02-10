import { MetaSwitch } from '@appsemble/react-components/src';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { BlockDetails } from '../../BlockDetails';
import { BlockList } from '../../BlockList';
import { messages } from './messages';

/**
 * Render routes related to blocks.
 */
export function BlockRoutes(): ReactElement {
  const { path } = useRouteMatch();

  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route exact path={path}>
        <BlockList />
      </Route>
      <Route exact path={`${path}/@:organization/:blockName/:version?`}>
        <BlockDetails />
      </Route>
      <Redirect to={path} />
    </MetaSwitch>
  );
}
