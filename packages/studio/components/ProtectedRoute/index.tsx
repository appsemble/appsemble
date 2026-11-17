import { useLocationString, useQuery } from '@appsemble/react-components';
import { type OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { Navigate, Outlet, useParams } from 'react-router-dom';

import { type Organization } from '../../types.js';
import { useUser } from '../UserProvider/index.js';

interface ProtectedRouteProps {
  readonly permissions?: OrganizationPermission[];
  readonly organization?: Organization;
  readonly organizationId?: string;
}

export function ProtectedRoute({
  organization,
  organizationId,
  permissions,
}: ProtectedRouteProps): ReactNode {
  const redirect = useLocationString();
  const { userInfo } = useUser();
  const qs = useQuery();
  const params = useParams<{ organizationId: string }>();

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);
    const targetOrganization = organizationId || organization?.id || params.organizationId;
    if (targetOrganization) {
      search.set('organization', targetOrganization);
    }
    return <Navigate to={{ pathname: '/login', search: `?${search}` }} />;
  }

  if (
    permissions &&
    (!organization ||
      !checkOrganizationRoleOrganizationPermissions(organization.roles, permissions))
  ) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
