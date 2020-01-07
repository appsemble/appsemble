import { Permission } from '@appsemble/utils';
import * as React from 'react';
import { Redirect, Route, RouteComponentProps, useLocation, useRouteMatch } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import useUser from '../../hooks/useUser';
import { Organization } from '../../types';
import checkRole from '../../utils/checkRole';

interface ProtectedRouteProps extends RouteComponentProps {
  permission?: Permission;
  organization?: Organization;
}

export default function ProtectedRoute({
  permission,
  organization,
  ...props
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const { userInfo, initialized } = useUser();
  const qs = useQuery();
  const match = useRouteMatch();

  if (!initialized) {
    return null;
  }

  if (!userInfo) {
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
