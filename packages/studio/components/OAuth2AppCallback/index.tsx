import { Loader, useQuery } from '@appsemble/react-components';
import { timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useEffect } from 'react';

import { type ExtendedOAuth2State } from '../../types.js';
import { oauth2Redirect } from '../../utils/oauth2Utils.js';

interface OAuth2AppCallbackProps {
  readonly session: ExtendedOAuth2State;
}

export function OAuth2AppCallback({ session }: OAuth2AppCallbackProps): ReactNode {
  const qs = useQuery();

  useEffect(() => {
    const code = qs.get('code');
    const state = qs.get('state');
    const error = state === session.state ? qs.get('error') : 'invalid_request';
    const appRequest = new URLSearchParams(session.appRequest);

    if (error) {
      oauth2Redirect(appRequest, { error });
      return;
    }
    const [, appId] = appRequest.get('client_id').split(':');

    axios
      .post<Record<string, string>>(`/api/apps/${appId}/secrets/oauth2/${session.id}/verify`, {
        code,
        scope: appRequest.get('scope'),
        redirectUri: appRequest.get('redirect_uri'),
        timezone,
      })
      .then(({ data }) => oauth2Redirect(appRequest, data))
      .catch((err) => {
        // In case of a conflict navigate the user back to the login page to link,
        // an existing account with any of the already associated login methods.
        if (axios.isAxiosError(err) && err.response.status === 409) {
          return oauth2Redirect(appRequest, { ...err.response.data.data });
        }
        return oauth2Redirect(appRequest, {
          code:
            axios.isAxiosError(err) && err.response.status < 500
              ? 'invalid_request'
              : 'server_error',
        });
      });
  }, [qs, session]);

  return <Loader />;
}
