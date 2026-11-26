import { AsyncButton, Button, Message, useSimpleForm } from '@appsemble/react-components';
import {
  type AppOAuth2Secret,
  type AppOAuth2SecretCheck,
  type AppOAuth2SecretLoginTest,
} from '@appsemble/types';
import { createOAuth2AuthorizationUrl, randomString } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, type MessageDescriptor } from 'react-intl';

import styles from './index.module.css';
import { messages } from './messages.js';
import {
  type OAuth2TestLoginAnswer,
  oauth2TestLoginKey,
} from '../../../../../../components/OAuth2TestLoginCallback/index.js';
import { useApp } from '../../../index.js';

interface OAuth2SecretTestProps {
  /**
   * The ID of the stored secret, whose client secret is used if the form omits it.
   */
  readonly secretId?: number;
}

type TestValues = Partial<AppOAuth2Secret>;

const statusColors: Record<AppOAuth2SecretCheck['status'], string> = {
  fail: 'is-danger',
  pass: 'is-success',
  skip: 'is-light',
  warn: 'is-warning',
};

const loginErrorMessages = {
  tokenUrl: messages.codeExchangeFailed,
  userInfoUrl: messages.userInfoFailed,
};

function getTestValues(
  {
    authorizationUrl,
    clientId,
    clientSecret,
    remapper,
    roleMappings,
    scope,
    tokenUrl,
    userInfoUrl,
  }: Record<string, any>,
  id?: number,
): TestValues {
  return {
    id,
    authorizationUrl,
    clientId,
    clientSecret: clientSecret || undefined,
    remapper: remapper || undefined,
    roleMappings: roleMappings?.length ? roleMappings : undefined,
    scope: ([] as string[]).concat(scope).join(' '),
    tokenUrl,
    userInfoUrl: userInfoUrl || undefined,
  };
}

function Detail({ children }: { readonly children?: string }): ReactNode {
  return children ? <code className={styles.detail}>{children}</code> : null;
}

function Claims({
  claims,
  title,
}: {
  readonly claims: unknown;
  readonly title: MessageDescriptor;
}): ReactNode {
  return claims ? (
    <details>
      <summary>
        <FormattedMessage {...title} />
      </summary>
      <pre>{JSON.stringify(claims, null, 2)}</pre>
    </details>
  ) : null;
}

function LoginResult({ result }: { readonly result: AppOAuth2SecretLoginTest }): ReactNode {
  const { error, roles, user } = result;
  return (
    <section className="content">
      {error ? (
        <Message color="danger">
          {error.reason === 'noSubject' ? (
            <FormattedMessage {...messages.noSubject} />
          ) : (
            <>
              <FormattedMessage {...loginErrorMessages[error.check]} />{' '}
              <FormattedMessage {...messages[error.reason]} /> <Detail>{error.detail}</Detail>
            </>
          )}
        </Message>
      ) : (
        <>
          <p>
            <FormattedMessage
              {...messages.loggedIn}
              values={{ sub: <code>{user?.sub}</code>, email: user?.email ?? '-' }}
            />
          </p>
          <p>
            {user?.groups?.length ? (
              <FormattedMessage
                {...messages.groups}
                values={{ groups: <code>{user.groups.join(', ')}</code> }}
              />
            ) : (
              <FormattedMessage {...messages.noGroups} />
            )}
          </p>
          {roles == null ? (
            <p>
              <FormattedMessage {...messages.defaultRole} />
            </p>
          ) : roles.length ? (
            <p>
              <FormattedMessage
                {...messages.roles}
                values={{ roles: <strong>{roles.join(', ')}</strong> }}
              />
            </p>
          ) : (
            <Message color="danger">
              <FormattedMessage {...messages.noRoleMatch} />
            </Message>
          )}
        </>
      )}
      <Claims claims={result.idToken} title={messages.idToken} />
      <Claims claims={result.accessToken} title={messages.accessToken} />
      <Claims claims={result.userInfo} title={messages.userInfo} />
      <Claims claims={user} title={messages.user} />
    </section>
  );
}

/**
 * Test the OAuth2 login settings of the surrounding form, which need not be saved.
 */
export function OAuth2SecretTest({ secretId }: OAuth2SecretTestProps): ReactNode {
  const { app } = useApp();
  const { values } = useSimpleForm();
  const [checks, setChecks] = useState<AppOAuth2SecretCheck[]>();
  const [error, setError] = useState<unknown>();
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [pendingLogin, setPendingLogin] = useState<{ state: string; values: TestValues }>();
  const [loginResult, setLoginResult] = useState<AppOAuth2SecretLoginTest>();
  const [providerError, setProviderError] = useState<string>();

  const testConnection = useCallback(async () => {
    setChecks(undefined);
    setError(undefined);
    try {
      const { data } = await axios.post<AppOAuth2SecretCheck[]>(
        `/api/apps/${app.id}/secrets/oauth2/test-connection`,
        getTestValues(values, secretId),
      );
      setChecks(data);
    } catch (err) {
      setError(err);
    }
  }, [app.id, secretId, values]);

  const tryLogin = useCallback(() => {
    const testValues = getTestValues(values, secretId);
    const state = randomString();
    const url = createOAuth2AuthorizationUrl(
      {
        authorizationUrl: testValues.authorizationUrl!,
        clientId: testValues.clientId!,
        redirectUrl: '/callback',
        scope: testValues.scope!,
      },
      state,
    );
    setError(undefined);
    setLoginResult(undefined);
    setProviderError(undefined);
    const popup = window.open(String(url), oauth2TestLoginKey, 'popup,width=600,height=700');
    setPopupBlocked(!popup);
    if (popup) {
      localStorage.setItem(`${oauth2TestLoginKey}.${state}`, 'pending');
      setPendingLogin({ state, values: testValues });
    }
  }, [secretId, values]);

  useEffect(() => {
    if (!pendingLogin) {
      return;
    }
    const channel = new BroadcastChannel(oauth2TestLoginKey);
    channel.addEventListener('message', async ({ data }: MessageEvent<OAuth2TestLoginAnswer>) => {
      if (data.state !== pendingLogin.state) {
        return;
      }
      setPendingLogin(undefined);
      if (data.error) {
        setProviderError([data.error, data.errorDescription].filter(Boolean).join(': '));
        return;
      }
      try {
        const { data: result } = await axios.post<AppOAuth2SecretLoginTest>(
          `/api/apps/${app.id}/secrets/oauth2/test-login`,
          { ...pendingLogin.values, code: data.code },
        );
        setLoginResult(result);
      } catch (err) {
        setError(err);
      }
    });
    return () => {
      channel.close();
      localStorage.removeItem(`${oauth2TestLoginKey}.${pendingLogin.state}`);
    };
  }, [app.id, pendingLogin]);

  const canTest = Boolean(URL.canParse(values.authorizationUrl) && values.clientId);

  return (
    <div className="mb-4">
      <div className="buttons mb-1">
        <AsyncButton disabled={!canTest} icon="plug" onClick={testConnection}>
          <FormattedMessage {...messages.testConnection} />
        </AsyncButton>
        <Button disabled={!canTest} icon="sign-in-alt" onClick={tryLogin}>
          <FormattedMessage {...messages.tryLogin} />
        </Button>
      </div>
      <p className="help mb-3">
        <FormattedMessage {...(pendingLogin ? messages.loginPending : messages.help)} />
      </p>
      {popupBlocked ? (
        <Message color="danger">
          <FormattedMessage {...messages.popupBlocked} />
        </Message>
      ) : null}
      {error ? (
        <Message color="danger">
          {axios.isAxiosError<{ message?: string }>(error) && error.response?.data?.message ? (
            error.response.data.message
          ) : (
            <FormattedMessage {...messages.requestError} />
          )}
        </Message>
      ) : null}
      {checks ? (
        <ul>
          {checks.map(({ check, detail, reason, status }) => (
            <li className="mb-2" key={check}>
              <span className={classNames('tag mr-2', statusColors[status])}>
                <FormattedMessage {...messages[status]} />
              </span>
              <strong>
                <FormattedMessage {...messages[check]} />
              </strong>
              {': '}
              <FormattedMessage {...messages[reason]} />
              {check === 'authorizationUrl' && status === 'warn' ? (
                <>
                  {' '}
                  <FormattedMessage {...messages.authorizationUrlWarning} />
                </>
              ) : null}{' '}
              <Detail>{detail}</Detail>
            </li>
          ))}
        </ul>
      ) : null}
      {providerError ? (
        <Message color="danger">
          <FormattedMessage {...messages.providerError} /> <Detail>{providerError}</Detail>
        </Message>
      ) : null}
      {loginResult ? <LoginResult result={loginResult} /> : null}
    </div>
  );
}
