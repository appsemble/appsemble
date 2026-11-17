import {
  Content,
  type LoginFormValues,
  Message,
  useMeta,
  useQuery,
  useToggle,
} from '@appsemble/react-components';
import { type TokenResponse } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Navigate } from 'react-router-dom';

import { LoginForm } from './LoginForm.js';
import { OrganizationLogin } from './OrganizationLogin/index.js';
import { messages } from './messages.js';
import { messages as organizationMessages } from './OrganizationLogin/messages.js';
import { useUser } from '../../components/UserProvider/index.js';
import { isLocalRedirect } from '../../utils/isLocalRedirect.js';

export function LoginPage(): ReactNode {
  useMeta(messages.title, messages.description);
  const { login, userInfo } = useUser();
  const qs = useQuery();
  const busy = useToggle();
  const [discoveredOrganization, setDiscoveredOrganization] = useState<string>();
  const organizationId =
    discoveredOrganization || (qs.get('personal') === '1' ? null : qs.get('organization'));
  const redirect = qs.get('redirect') || '/apps';

  const onPasswordLogin = useCallback(
    async ({ email, password }: LoginFormValues) => {
      busy.enable();
      try {
        const { data } = await axios.post<TokenResponse>('/api/auth/email/login', undefined, {
          headers: { authorization: `Basic ${btoa(`${email}:${password}`)}` },
        });
        login(data);
      } finally {
        busy.disable();
      }
    },
    [busy, login],
  );

  if (!isLocalRedirect(redirect)) {
    return (
      <Content>
        <Message color="danger">
          <FormattedMessage {...organizationMessages.invalidRedirect} />
        </Message>
      </Content>
    );
  }
  if (organizationId) {
    return (
      <Content>
        <OrganizationLogin
          autoStart={Boolean(discoveredOrganization)}
          busy={busy}
          onBack={discoveredOrganization ? () => setDiscoveredOrganization(undefined) : undefined}
          onOrganizationSelected={setDiscoveredOrganization}
          onPasswordLogin={onPasswordLogin}
          organizationId={organizationId}
        />
      </Content>
    );
  }
  if (userInfo) {
    return <Navigate to={redirect} />;
  }

  return (
    <Content>
      <LoginForm
        busy={busy}
        onOrganizationSelected={setDiscoveredOrganization}
        onPasswordLogin={onPasswordLogin}
      />
    </Content>
  );
}
