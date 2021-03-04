import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, useRouteMatch } from 'react-router-dom';

import { IndexPage } from './IndexPage';
import { messages } from './messages';
import { Snapshot as SnapshotRoute } from './snapshot';

export interface Snapshot {
  id: number;
  $created: Date;
  $author: {
    id: string;
    name?: string;
  };
  yaml?: string;
}

export function SnapshotsRoutes(): ReactElement {
  useMeta(messages.title);
  const { path, url } = useRouteMatch();

  return (
    <MetaSwitch>
      <Route exact path={path}>
        <IndexPage />
      </Route>
      <Route exact path={`${path}/:snapshotId`}>
        <SnapshotRoute />
      </Route>
      <Redirect to={url} />
    </MetaSwitch>
  );
}
