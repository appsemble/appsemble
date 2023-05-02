import { MetaSwitch } from '@appsemble/react-components';
import { type ReactElement } from 'react';
import { Navigate, Route } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { OrganizationRoutes } from './organization/index.js';

/**
 * Render routes related to apps.
 */
export function OrganizationsRoutes(): ReactElement {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<OrganizationRoutes />} path="/:organizationId/*" />
      <Route element={<Navigate to="/organizations" />} path="*" />
    </MetaSwitch>
  );
}
