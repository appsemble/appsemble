import { MetaSwitch } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { ActionPage } from './action/index.js';
import { AppPage } from './app/index.js';
import Introduction from './introduction.md';
import { messages } from './messages.js';

export function ReferenceRoutes(): ReactNode {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<Introduction />} path="/" />
      <Route element={<AppPage />} path="/app" />
      <Route element={<ActionPage />} path="/action" />
      <Route element={<Navigate to="/" />} path="*" />
    </MetaSwitch>
  );
}
