import {
  Button,
  Login,
  type LoginFormValues,
  Loader,
  Message,
  SSOLoginButton,
  type Toggle,
  Title,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { type OrganizationLoginMethod, type OrganizationSsoSettings } from '@appsemble/types';
import { storageKey } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { messages } from './messages.js';
import { useUser } from '../../../components/UserProvider/index.js';
import { isLocalRedirect } from '../../../utils/isLocalRedirect.js';
import { enableRegistration, logins } from '../../../utils/settings.js';

interface OrganizationLoginProps {
  readonly organizationId: string;
  readonly onPasswordLogin: (values: LoginFormValues) => Promise<void>;
  readonly busy: Toggle;
}

export function OrganizationLogin({
  organizationId,
  onPasswordLogin,
  busy,
}: OrganizationLoginProps): ReactNode {
  const { userInfo } = useUser();
  const qs = useQuery();
  const url = `/api/organizations/${encodeURIComponent(organizationId)}/sso/login`;
  const { data, error, loading } =
    useData<Pick<OrganizationSsoSettings, 'name' | 'policy' | 'allowedLoginMethods'>>(url);
  const [startError, setStartError] = useState(false);
  const redirect = qs.get('redirect') || `/organizations/${encodeURIComponent(organizationId)}`;

  const start = useCallback(async () => {
    busy.enable();
    setStartError(false);
    try {
      const response = await axios.post<{ authorizationUrl: string }>(url, {
        redirect,
        link: Boolean(userInfo),
      });
      const { authorizationUrl } = response.data;
      const state = new URL(authorizationUrl).searchParams.get('state');
      sessionStorage.setItem(
        storageKey,
        JSON.stringify({ organizationId, authorizationUrl, state, redirect }),
      );
      window.location.href = authorizationUrl;
    } catch {
      setStartError(true);
      busy.disable();
    }
  }, [busy, organizationId, redirect, url, userInfo]);

  if (loading) {
    return <Loader />;
  }
  if (error || !isLocalRedirect(redirect)) {
    return (
      <Message color="danger">
        <FormattedMessage {...(error ? messages.unavailable : messages.invalidRedirect)} />
      </Message>
    );
  }

  const allowOtherMethods = data.policy !== 'required';

  return (
    <>
      <Title>{data.name}</Title>
      {startError ? (
        <Message color="danger">
          <FormattedMessage {...messages.error} />
        </Message>
      ) : null}
      <Button color="primary" disabled={busy.enabled} onClick={start}>
        {userInfo ? (
          <FormattedMessage {...messages.link} />
        ) : (
          <FormattedMessage {...messages.loginWith} values={{ name: data.name }} />
        )}
      </Button>
      {allowOtherMethods && data.policy === 'required-with-guests' ? (
        <p className="my-4">
          <FormattedMessage {...messages.guestHelp} />
        </p>
      ) : null}
      {userInfo ? (
        <Button className="ml-3" component={Link} to={redirect}>
          <FormattedMessage {...messages.continue} />
        </Button>
      ) : allowOtherMethods ? (
        <>
          {data.allowedLoginMethods.includes('password') ? (
            <Login
              enableRegistration={enableRegistration}
              onPasswordLogin={onPasswordLogin}
              registerLink="../register"
              resetPasswordLink="../reset-password"
            />
          ) : null}
          <div className="mt-4">
            {logins
              .filter((provider) =>
                data.allowedLoginMethods.includes(
                  provider.name.toLowerCase() as OrganizationLoginMethod,
                ),
              )
              .map((provider) => (
                <SSOLoginButton
                  authorizationUrl={provider.authorizationUrl}
                  className="mr-2"
                  clientId={provider.clientId}
                  disabled={busy.enabled}
                  icon={provider.icon}
                  key={provider.authorizationUrl}
                  onClick={busy.enable}
                  redirect={redirect}
                  redirectUrl="/callback"
                  scope={provider.scope}
                >
                  <FormattedMessage {...messages.loginWith} values={{ name: provider.name }} />
                </SSOLoginButton>
              ))}
          </div>
        </>
      ) : null}
    </>
  );
}
