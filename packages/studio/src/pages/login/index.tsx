import {
  Content,
  Login,
  LoginFormValues,
  OAuth2LoginButton,
  useMeta,
  useQuery,
  useToggle,
} from '@appsemble/react-components';
import { TokenResponse } from '@appsemble/types';
import axios from 'axios';
import { ReactElement, useCallback } from 'react';
import { FormattedMessage } from 'react-intl';
import { useParams } from 'react-router-dom';

import { useUser } from '../../components/UserProvider';
import { enableRegistration, logins } from '../../utils/settings';
import styles from './index.module.css';
import { messages } from './messages';

export function LoginPage(): ReactElement {
  useMeta(messages.title, messages.description);
  const { login } = useUser();
  const qs = useQuery();
  const busy = useToggle();
  const { lang } = useParams<{ lang: string }>();

  const onPasswordLogin = useCallback(
    async ({ email, password }: LoginFormValues) => {
      busy.enable();
      try {
        const { data } = await axios.post<TokenResponse>('/api/login', undefined, {
          headers: { authorization: `Basic ${btoa(`${email}:${password}`)}` },
        });
        login(data);
      } catch (error: unknown) {
        busy.disable();
        throw error;
      }
    },
    [busy, login],
  );

  return (
    <Content>
      <Login
        enableRegistration={enableRegistration}
        onPasswordLogin={onPasswordLogin}
        registerLink={`/${lang}/register`}
        resetPasswordLink={`/${lang}/reset-password`}
      />
      <div className={`${styles.socialLogins} mt-5`}>
        {logins.map((provider) => (
          <OAuth2LoginButton
            authorizationUrl={provider.authorizationUrl}
            className="mr-2"
            clientId={provider.clientId}
            disabled={busy.enabled}
            icon={provider.icon}
            key={provider.authorizationUrl}
            onClick={busy.enable}
            redirect={qs.get('redirect')}
            redirectUrl="/callback"
            scope={provider.scope}
          >
            <FormattedMessage {...messages.loginWith} values={{ name: provider.name }} />
          </OAuth2LoginButton>
        ))}
      </div>
    </Content>
  );
}
