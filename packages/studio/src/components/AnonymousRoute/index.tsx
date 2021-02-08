import { useQuery } from '@appsemble/react-components';
import { ReactElement } from 'react';
import { Redirect, Route, RouteProps, useParams } from 'react-router-dom';

import { useUser } from '../UserProvider';

/**
 * Render a route that is only available if the user is not logged in.
 *
 * If the user is logged in, the user is redirected to the URL specified in the `redirect` search
 * parameter, which defaults to `/apps`.
 */
export function AnonymousRoute(props: RouteProps): ReactElement {
  const { userInfo } = useUser();
  const qs = useQuery();
  const { lang } = useParams<{ lang: string }>();

  return userInfo ? <Redirect to={qs.get('redirect') || `/${lang}/apps`} /> : <Route {...props} />;
}
