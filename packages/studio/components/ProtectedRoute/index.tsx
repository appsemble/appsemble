import { useLocationString, useQuery } from '@appsemble/react-components';
import { Permission } from '@appsemble/utils';
import { ReactElement } from 'react';
import { Redirect, Route, RouteProps, useRouteMatch } from 'react-router-dom';

import { Organization } from '../../types.js';
import { checkRole } from '../../utils/checkRole.js';
import { useUser } from '../UserProvider/index.js';

interface ProtectedRouteProps extends RouteProps {
  permission?: Permission;
  organization?: Organization;
}

export function ProtectedRoute({
  organization,
  permission,
  ...props
}: ProtectedRouteProps): ReactElement {
  const redirect = useLocationString();
  const { userInfo } = useUser();
  const qs = useQuery();
  const {
    params: { lang },
    url,
  } = useRouteMatch<{ lang: string }>();

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', redirect);
    return <Redirect to={{ pathname: `/${lang}/login`, search: `?${search}` }} />;
  }

  if (permission && (!organization || !checkRole(organization.role, permission))) {
    return <Redirect to={url} />;
  }

  return <Route {...props} />;
}
