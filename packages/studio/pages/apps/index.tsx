import { MetaSwitch } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { AppRoutes } from './app/index.js';
import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';

/**
 * Render routes related to apps.
 */
export function AppsRoutes(): ReactElement {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<AppRoutes />} path="/:id/*" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
