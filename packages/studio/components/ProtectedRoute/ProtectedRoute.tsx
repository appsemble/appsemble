import * as React from 'react';
import { Redirect, Route, RouteComponentProps, useLocation } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import { User } from '../../types';

export interface ProtectedRouteProps extends RouteComponentProps {
  user: User;
}

export default function ProtectedRoute({
  user,
  ...props
}: ProtectedRouteProps): React.ReactElement {
  const location = useLocation();
  const qs = useQuery();

  if (!user) {
    const search = new URLSearchParams(qs);
    search.set('redirect', `${location.pathname}${location.search}${location.hash}`);
    return <Redirect to={{ pathname: '/login', search: `?${search}` }} />;
  }

  return <Route {...props} />;
}
