import * as React from 'react';
import { Redirect, Route, RouteComponentProps, useLocation } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import useUser from '../../hooks/useUser';

export default function ProtectedRoute(props: RouteComponentProps): React.ReactElement {
  const location = useLocation();
  const { userInfo } = useUser();
  const qs = useQuery();

  if (!userInfo) {
    const search = new URLSearchParams(qs);
    search.set('redirect', `${location.pathname}${location.search}${location.hash}`);
    return <Redirect to={{ pathname: '/login', search: `?${search}` }} />;
  }

  return <Route {...props} />;
}
