import { MetaSwitch } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Route, useParams } from 'react-router-dom';

import { IndexPage } from './IndexPage/index.js';
import { messages } from './messages.js';
import { OrganizationRoutes } from './organization/index.js';
import { ProtectedRoute } from '../../components/ProtectedRoute/index.js';
import { useUser } from '../../components/UserProvider/index.js';

/**
 * Ask anonymous visitors to sign in before they open an organization subpage.
 *
 * One route renders every page of an organization, so moving between its pages keeps the loaded
 * organization.
 */
function GuardedOrganizationRoutes(): ReactNode {
  const { userInfo } = useUser();
  const { '*': subpage } = useParams();
  return userInfo || !subpage ? <OrganizationRoutes /> : <ProtectedRoute />;
}

/**
 * Render routes related to apps.
 */
export function OrganizationsRoutes(): ReactNode {
  return (
    <MetaSwitch description={messages.description} title={messages.title}>
      <Route element={<IndexPage />} path="/" />
      <Route element={<GuardedOrganizationRoutes />} path="/:organizationId/*" />
      <Route element={<Navigate to="/organizations" />} path="*" />
    </MetaSwitch>
  );
}
