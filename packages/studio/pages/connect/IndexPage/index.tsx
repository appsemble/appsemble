import { Button, Content, Loader, Message, useMeta, useQuery } from '@appsemble/react-components';
import { type LoginCodeResponse } from '@appsemble/types';
import axios from 'axios';
import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, type MessageDescriptor, useIntl } from 'react-intl';
import { Link } from 'react-router-dom';

import styles from './index.module.css';
import { messages } from './messages.js';
import { oauth2Redirect, verifyOAuth2LoginRequest } from '../../../utils/oauth2Utils.js';

/**
 * Handle login to apps using OAuth2.
 */
export function IndexPage(): ReactNode {
  const qs = useQuery();
  const { formatMessage } = useIntl();

  const [appLoading, setAppLoading] = useState(true);
  const [appName, setAppName] = useState<string>();
  const [isAllowed, setIsAllowed] = useState<boolean>();
  const [error, setError] = useState<MessageDescriptor>(null);
  const [generating, setGenerating] = useState(false);

  const appId = useMemo(() => {
    const match = /^app:(\d+)$/.exec(qs.get('client_id'));
    if (match) {
      return Number(match[1]);
    }
  }, [qs]);

  useMeta(formatMessage(messages.title, { app: appName || appId }));
  const scopes = useMemo(() => qs.get('scope')?.split(' '), [qs]);
  const redirectUri = qs.get('redirect_uri');
  const scope = qs.get('scope');
  const isRequestValid = useMemo(
    () =>
      verifyOAuth2LoginRequest(qs, [
        'email',
        'openid',
        'profile',
        'resources:manage',
        'teams:read',
        'teams:write',
      ]),
    [qs],
  );

  const onAccept = useCallback(() => {
    setGenerating(true);
    axios
      .post<LoginCodeResponse>('/api/oauth2/consent/agree', {
        appId,
        redirectUri,
        scope: [...new Set(scopes)].join(' '),
      })
      .then(({ data }) => oauth2Redirect(qs, { code: data.code }))
      .catch(() => oauth2Redirect(qs, { error: 'server_error' }));
  }, [appId, qs, redirectUri, scopes]);

  const onDeny = useCallback(() => {
    oauth2Redirect(qs, { error: 'access_denied' });
  }, [qs]);

  useEffect(() => {
    if (!isRequestValid) {
      return;
    }

    axios
      .post<LoginCodeResponse>('/api/oauth2/consent/verify', {
        appId,
        redirectUri,
        scope,
      })
      .then(({ data }) => {
        if (!data.isAllowed) {
          setIsAllowed(data.isAllowed);
          setAppName(data.appName);
          setAppLoading(false);
          return;
        }

        oauth2Redirect(qs, { code: data.code });
      })
      .catch(({ response: { data, status } }) => {
        if (!(status === 400 && 'appName' in data.data)) {
          setError(messages.unknownError);
        }

        setIsAllowed(data.data.isAllowed);
        setAppName(data.data.appName);
        setAppLoading(false);
      });
  }, [appId, isRequestValid, qs, redirectUri, scope]);

  if (error) {
    return (
      <Content padding>
        <Message color="danger">
          <FormattedMessage {...error} />
        </Message>
      </Content>
    );
  }

  if (appLoading) {
    return <Loader />;
  }

  if (!isAllowed) {
    return (
      <Content padding>
        <div className="content">
          <Message color="warning">
            <FormattedMessage
              {...messages.notAllowed}
              values={{
                app: (
                  <Link className="has-text-weight-bold is-italic" to={`../../apps/${appId}`}>
                    {appName}
                  </Link>
                ),
              }}
            />
          </Message>
          <Button className={`${styles.returnButton} is-block`} onClick={onDeny}>
            <FormattedMessage {...messages.returnToApp} />
          </Button>
        </div>
      </Content>
    );
  }

  return (
    <Content padding>
      <div className="content">
        <p>
          <FormattedMessage
            {...messages.prompt}
            values={{
              app: (
                <Link className="has-text-weight-bold is-italic" to={`../../apps/${appId}`}>
                  {appName}
                </Link>
              ),
            }}
          />
        </p>
        <ul>
          {/* XXX We don’t make a distinction between these in our userinfo endpoint yet. */}
          {scopes.includes('email') || scopes.includes('openid') || scopes.includes('profile') ? (
            <li>
              <FormattedMessage {...messages.readProfile} />
            </li>
          ) : null}
          {scopes.includes('resources:manage') && (
            <li>
              <FormattedMessage {...messages.manageResource} />
            </li>
          )}
        </ul>
      </div>
      <div className="has-text-centered">
        <Button
          className={`mx-3 my-3 ${styles.button}`}
          data-testid="deny"
          disabled={generating}
          onClick={onDeny}
        >
          <FormattedMessage {...messages.deny} />
        </Button>
        <Button
          className={`mx-3 my-3 ${styles.button}`}
          color="primary"
          data-testid="allow"
          disabled={generating}
          loading={generating}
          onClick={onAccept}
        >
          <FormattedMessage {...messages.allow} />
        </Button>
      </div>
    </Content>
  );
}
