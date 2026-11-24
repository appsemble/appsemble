import { Button, Loader, Message, useQuery } from '@appsemble/react-components';
import { type OAuth2ClientCredentials, type TokenResponse } from '@appsemble/types';
import { clearOAuth2State, timezone } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, useNavigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { type ExtendedOAuth2State } from '../../types.js';
import { isLocalRedirect } from '../../utils/isLocalRedirect.js';
import { messages as callbackMessages } from '../OAuth2StudioCallback/messages.js';
import { useUser } from '../UserProvider/index.js';

interface OrganizationSsoCallbackProps {
  readonly session: ExtendedOAuth2State;
}

export function OrganizationSsoCallback({ session }: OrganizationSsoCallbackProps): ReactNode {
  const qs = useQuery();
  const navigate = useNavigate();
  const { lang } = useParams<{ lang: string }>();
  const { login } = useUser();
  const [error, setError] = useState<'conflict' | 'error' | 'invalidState'>();
  const [failureMessage, setFailureMessage] = useState<string>();
  const code = qs.get('code');
  const state = qs.get('state');
  const issuer = qs.get('iss');
  const providerError = qs.get('error_description') || qs.get('error');

  useEffect(() => {
    if (providerError) {
      setError('error');
      setFailureMessage(providerError);
      clearOAuth2State();
      return;
    }
    if (!code || !state || state !== session.state || !isLocalRedirect(session.redirect)) {
      setError('invalidState');
      return;
    }
    axios
      .post<OAuth2ClientCredentials | TokenResponse>(
        `/api/organizations/${encodeURIComponent(session.organizationId)}/sso/callback`,
        {
          code,
          state,
          iss: issuer ?? undefined,
          timezone,
        },
      )
      .then(({ data }) => {
        if (!('access_token' in data)) {
          clearOAuth2State();
          navigate(session.redirect, { replace: true, state: { clientCredentials: data } });
          return;
        }
        login(data);
        clearOAuth2State();
        navigate(session.redirect || `/organizations/${session.organizationId}`, { replace: true });
      })
      .catch((err: unknown) => {
        setError(axios.isAxiosError(err) && err.response?.status === 409 ? 'conflict' : 'error');
        setFailureMessage(
          axios.isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined,
        );
        clearOAuth2State();
      });
  }, [code, issuer, login, navigate, providerError, session, state]);

  if (!error) {
    return <Loader />;
  }

  const returnToOrganization = `/${lang}/login?${new URLSearchParams({ organization: session.organizationId, redirect: session.redirect })}`;

  return (
    <>
      <Message color="danger">
        {error === 'error' && failureMessage ? (
          failureMessage
        ) : (
          <FormattedMessage
            {...(error === 'invalidState' ? callbackMessages.invalidState : messages[error])}
          />
        )}
      </Message>
      {error === 'conflict' ? (
        <Button
          component={Link}
          to={`/${lang}/login?${new URLSearchParams({ personal: '1', redirect: returnToOrganization })}`}
        >
          <FormattedMessage {...messages.signIn} />
        </Button>
      ) : null}
      {error === 'error' && isLocalRedirect(session.redirect) ? (
        <Button component={Link} to={session.redirect}>
          <FormattedMessage {...messages.return} />
        </Button>
      ) : null}
    </>
  );
}
