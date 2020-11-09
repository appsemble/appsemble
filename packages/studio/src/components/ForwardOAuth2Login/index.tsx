import { Content, Loader, Message, useLocationString, useQuery } from '@appsemble/react-components';
import { AppOAuth2Secret } from '@appsemble/types';
import { startOAuth2Login } from '@appsemble/web-utils';
import axios from 'axios';
import React, { ReactElement, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { messages } from './messages';

export function ForwardOAuth2Login(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const qs = useQuery();
  const location = useLocationString();

  const [hasError, setError] = useState(false);

  useEffect(() => {
    const clientId = qs.get('client_id');
    const [, appId] = clientId.split(':');
    axios
      .get<AppOAuth2Secret>(`/api/apps/${appId}/secrets/oauth2/${id}`)
      .then(({ data }) =>
        startOAuth2Login(
          { ...data, redirect: location, redirectUrl: '/callback' },
          { appRequest: String(qs), id },
        ),
      )
      .catch(() => setError(true));
  }, [id, location, qs]);

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
