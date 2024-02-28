import { useQuery } from '@appsemble/react-components';
import { type ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

import { useUser } from '../UserProvider/index.js';

/**
 * Render a route that is only available if the user is not logged in.
 *
 * If the user is logged in, the user is redirected to the URL specified in the `redirect` search
 * parameter, which defaults to `/apps`.
 */
export function AnonymousRoute(): ReactNode {
  const { userInfo } = useUser();
  const qs = useQuery();

  return userInfo ? <Navigate to={qs.get('redirect') || '/apps'} /> : <Outlet />;
}
