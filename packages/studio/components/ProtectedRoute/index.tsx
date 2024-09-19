import { useLocationString, useQuery } from '@appsemble/react-components';
import { type OrganizationPermission } from '@appsemble/types';
import { checkOrganizationRoleOrganizationPermissions } from '@appsemble/utils';
import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { type Organization } from '../../types.js';
import { useUser } from '../UserProvider/index.js';

interface ProtectedRouteProps {
  readonly permissions?: OrganizationPermission[];
  readonly organization?: Organization;
}

export function ProtectedRoute({ organization, permissions }: ProtectedRouteProps): ReactNode {
  const redirect = useLocationString();
  const { userInfo } = useUser();
  const qs = useQuery();

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);
    return <Navigate to={{ pathname: '/login', search: `?${search}` }} />;
  }

  if (
    permissions &&
    (!organization || !checkOrganizationRoleOrganizationPermissions(organization.role, permissions))
  ) {
    return <Navigate to="/" />;
  }

  return <Outlet />;
}
