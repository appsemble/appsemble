import * as React from 'react';
import { Redirect, Route, RouteComponentProps } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import useUser from '../../hooks/useUser';
import { UserInfo } from '../../types';

export interface AnonymousRouteProps extends RouteComponentProps {
  user: UserInfo;
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
  const { userInfo } = useUser();
  const qs = useQuery();

  return userInfo ? <Redirect to={qs.get('redirect') || '/apps'} /> : <Route {...props} />;
}
