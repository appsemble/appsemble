import { Permission } from '@appsemble/utils';
import * as React from 'react';
import { Redirect, Route, RouteComponentProps, useLocation } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import { Organization, User } from '../../types';
import checkRole from '../../utils/checkRole';

export interface ProtectedRouteProps extends RouteComponentProps {
  user: User;
  permission?: Permission;
  organization?: Organization;
}

export default function ProtectedRoute({
  user,
  permission,
  organization,
  match,
  ...props
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const qs = useQuery();

  if (!user) {
    const search = new URLSearchParams(qs);
    search.set('redirect', `${location.pathname}${location.search}${location.hash}`);
    return <Redirect to={{ pathname: '/login', search: `?${search}` }} />;
  }

  if (permission) {
    if (!organization || !checkRole(organization.role, permission)) {
      return <Redirect to={match.url} />;
    }
  }

  return <Route {...props} />;
}
