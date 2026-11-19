import {
  Button,
  type LoginFormValues,
  Loader,
  Message,
  type Toggle,
  Title,
  useData,
  useQuery,
} from '@appsemble/react-components';
import { type OrganizationSsoSettings } from '@appsemble/types';
import { storageKey } from '@appsemble/web-utils';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Navigate, useParams } from 'react-router-dom';

import { messages } from './messages.js';
import { LoginForm } from '../LoginForm.js';
import { messages as loginMessages } from '../messages.js';
import { useUser } from '../../../components/UserProvider/index.js';

interface OrganizationLoginProps {
  readonly autoStart?: boolean;
  readonly onBack?: () => void;
  readonly onOrganizationSelected: (organizationId: string) => void;
  readonly organizationId: string;
  readonly onPasswordLogin: (values: LoginFormValues) => Promise<void>;
  readonly busy: Toggle;
}

export function OrganizationLogin({
  autoStart,
  onBack,
  onOrganizationSelected,
  organizationId,
  onPasswordLogin,
  busy,
}: OrganizationLoginProps): ReactNode {
  const { userInfo } = useUser();
  const qs = useQuery();
  const { lang } = useParams<{ lang: string }>();
  const url = `/api/organizations/${encodeURIComponent(organizationId)}/sso/login`;
  const { data, error, loading } =
    useData<Pick<OrganizationSsoSettings, 'name' | 'policy' | 'allowedLoginMethods'>>(url);
  const [startError, setStartError] = useState(false);
  const started = useRef(false);
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

  useEffect(() => {
    if (autoStart && data && !userInfo && !started.current) {
      started.current = true;
      start();
    }
  }, [autoStart, data, redirect, start, userInfo]);

  if (loading) {
    return <Loader />;
  }
  if (error?.response?.status === 404) {
    return userInfo ? (
      <Navigate to={redirect} />
    ) : (
      <LoginForm
        busy={busy}
        onOrganizationSelected={onOrganizationSelected}
        onPasswordLogin={onPasswordLogin}
        organizationId={organizationId}
      />
    );
  }
  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...messages.unavailable} />
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
      {onBack ? (
        <Button className="ml-3" disabled={busy.enabled} onClick={onBack}>
          <FormattedMessage {...loginMessages.changeEmail} />
        </Button>
      ) : null}
      {allowOtherMethods && data.policy === 'required-with-guests' ? (
        <p className="my-4">
          <FormattedMessage {...messages.guestHelp} />
        </p>
      ) : null}
      {userInfo ? (
        <Button className="ml-3" component={Link} to={redirect}>
          <FormattedMessage {...messages.continue} />
        </Button>
      ) : autoStart || !allowOtherMethods ? null : (
        <LoginForm
          allowedLoginMethods={data.allowedLoginMethods}
          busy={busy}
          onOrganizationSelected={(id) =>
            id === organizationId ? start() : onOrganizationSelected(id)
          }
          onPasswordLogin={onPasswordLogin}
          organizationId={organizationId}
        />
      )}
      {!userInfo && !allowOtherMethods ? (
        <details className="mt-4">
          <summary>
            <FormattedMessage {...loginMessages.otherOptions} />
          </summary>
          <Link
            to={`/${lang}/login?${new URLSearchParams({
              personal: '1',
              redirect: `/${lang}/login?${new URLSearchParams({ organization: organizationId, redirect })}`,
            })}`}
          >
            <FormattedMessage {...loginMessages.existingAccount} />
          </Link>
        </details>
      ) : null}
    </>
  );
}
