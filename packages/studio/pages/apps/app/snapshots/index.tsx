import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { SnapshotPage } from './snapshot/index.js';

export function SnapshotsRoutes(): ReactNode {
  useMeta(messages.title);

  return (
    <MetaSwitch>
      <Route element={<IndexPage />} path="/" />
      <Route element={<SnapshotPage />} path="/:snapshotId" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
