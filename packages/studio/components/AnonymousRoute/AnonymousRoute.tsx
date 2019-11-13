import * as React from 'react';
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import { User } from '../../types';

export interface AnonymousRouteProps extends RouteComponentProps {
  user: User;
}

/**
 * Render a route that is only available if the user is not logged in.
 *
 * If the user is logged in, the user is redirected to the URL specified in the `redirect` search
 * parameter, which defaults to `/apps`.
 */
export default function AnonymousRoute({
  user,
  ...props
}: AnonymousRouteProps): React.ReactElement {
  const qs = useQuery();

  return user ? <Redirect to={qs.get('redirect') || '/apps'} /> : <Route {...props} />;
}
