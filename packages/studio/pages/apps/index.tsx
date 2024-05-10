import { MetaSwitch } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { AppRoutes } from './app/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

/**
 * Render routes related to apps.
 */
export function AppsRoutes(): ReactNode {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      {/* For compatibility with old app links, see #1490 */}
      <Route element={<AppRoutes />} path="/:id/" />
      <Route element={<AppRoutes />} path="/:id/:path/*" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
