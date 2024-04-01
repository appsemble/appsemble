import { MetaSwitch } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import ActionPage from './action.mdx';
import AppPage from './app.mdx';
import IndexPage from './index.md';
import { messages } from './messages.js';

export function ReferenceRoutes(): ReactNode {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<AppPage />} path="/app" />
      <Route element={<ActionPage />} path="/action" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
