import { MetaSwitch, useMeta } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { DetailsPage } from './details/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

export function AppsRoutes(): ReactNode {
  useMeta(messages.title);
  return (
    <MetaSwitch title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<DetailsPage />} path="/:appId" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
