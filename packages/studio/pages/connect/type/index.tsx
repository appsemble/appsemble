import { Content, Loader, Message, useLocationString, useQuery } from '@appsemble/react-components';
import { type AppOAuth2Secret } from '@appsemble/types';
import { startOAuth2Login, timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages.js';

export function TypePage(): ReactNode {
  const { id, type } = useParams<{ id: string; type: 'oauth2' | 'saml' }>();
  const qs = useQuery();
  const location = useLocationString();

  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const clientId = qs.get('client_id');
    const [, appId] = clientId.split(':');
    if (type === 'oauth2') {
      axios
        .get<AppOAuth2Secret>(`/api/apps/${appId}/secrets/oauth2/${id}`)
        .then(({ data }) =>
          startOAuth2Login(
            { ...data, redirect: location, redirectUrl: '/callback' },
            { appRequest: String(qs), id },
          ),
        )
        .catch(() => setHasError(true));
    } else if (type === 'saml') {
      axios
        .post<{ redirect: string }>(`/api/apps/${appId}/saml/${id}/authn`, {
          redirectUri: qs.get('redirect_uri'),
          scope: qs.get('scope'),
          state: qs.get('state'),
          timezone,
        })
        .then(({ data }) => window.location.replace(data.redirect))
        .catch(() => setHasError(true));
    }
  }, [id, location, qs, type]);

  if (hasError) {
    return (
      <Content>
        <Message color="danger">
          <FormattedMessage {...messages.error} />
        </Message>
      </Content>
    );
  }

  return <Loader />;
}
