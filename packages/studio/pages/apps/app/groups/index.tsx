import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { GroupPage } from './group/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

export function GroupsRoutes(): ReactNode {
  useMeta(messages.title);

  return (
    <MetaSwitch>
      <Route element={<IndexPage />} path="/" />
      <Route element={<GroupPage />} path="/:groupId" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
