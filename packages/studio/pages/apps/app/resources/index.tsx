import { MetaSwitch } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { ResourceRoutes } from './resource/index.js';

export function ResourcesRoutes(): ReactNode {
  return (
    <MetaSwitch title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<ResourceRoutes />} path="/:resourceName/*" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
