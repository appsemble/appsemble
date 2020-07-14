import { useQuery } from '@appsemble/react-components';
import React, { ReactElement } from 'react';
import { Redirect, Route, RouteProps } from 'react-router-dom';

import { useUser } from '../UserProvider';

/**
 * Render a route that is only available if the user is not logged in.
 *
 * If the user is logged in, the user is redirected to the URL specified in the `redirect` search
 * parameter, which defaults to `/apps`.
 */
export default function AnonymousRoute(props: RouteProps): ReactElement {
  const { userInfo } = useUser();
  const qs = useQuery();

  return userInfo ? <Redirect to={qs.get('redirect') || '/apps'} /> : <Route {...props} />;
}
