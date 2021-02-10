import { MetaSwitch } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { CMSRoot } from '../CMSRoot';
import { ResourceTable } from '../ResourceTable';
import { messages } from './messages';

export function CMS(): ReactElement {
  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch title={messages.title}>
      <Route exact path={path}>
        <CMSRoot />
      </Route>
      <Route path={`${path}/:resourceName`}>
        <ResourceTable />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
