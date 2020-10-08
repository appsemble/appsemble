import { Button, Content, Loader, Message, useQuery } from '@appsemble/react-components';
import axios from 'axios';
import React, { ReactElement, useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { Link, useParams } from 'react-router-dom';

import { oauth2Redirect, verifyOAuth2LoginRequest } from '../../utils/oauth2Utils';
import { HelmetIntl } from '../HelmetIntl';
import styles from './index.css';
import { messages } from './messages';

/**
 * Handle login to apps using OAuth2.
 */
export function OpenIDLogin(): ReactElement {
  const qs = useQuery();
  const { lang } = useParams<{ lang: string }>();

  const [appLoading, setAppLoading] = useState(true);
  const [appName, setAppName] = useState<string>();
  const [error, setError] = useState<MessageDescriptor>(null);
  const [generating, setGenerating] = useState(false);

  const appId = useMemo(() => {
    const match = /^app:(\d+)$/.exec(qs.get('client_id'));
    if (match) {
      return Number(match[1]);
    }
  }, [qs]);
  const scopes = useMemo(() => qs.get('scope')?.split(' '), [qs]);
  const redirectUri = qs.get('redirect_uri');
  const scope = qs.get('scope');
  const isRequestValid = useMemo(
    () => verifyOAuth2LoginRequest(qs, ['email', 'openid', 'profile', 'resources:manage']),
    [qs],
  );

  const onAccept = useCallback(() => {
    setGenerating(true);
    axios
      .post('/api/oauth2/consent/agree', {
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
      .post('/api/oauth2/consent/verify', { appId, redirectUri, scope })
      .then(({ data: { code } }) => oauth2Redirect(qs, { code }))
      .catch(({ response: { data, status } }) => {
        if (!(status === 404 && 'appName' in data.data)) {
          setError(messages.unknownError);
        }
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

  return (
    <Content padding>
      <HelmetIntl title={messages.title} titleValues={{ app: appName }} />
      <div className="content">
        <p>
          <FormattedMessage
            {...messages.prompt}
            values={{
              app: (
                <Link className="has-text-weight-bold is-italic" to={`${lang}/apps/${appId}`}>
                  {appName}
                </Link>
              ),
            }}
          />
        </p>
        <ul>
          {/* XXX We don’t make a distinction between these in our userinfo endpoint yet. */}
          {(scopes.includes('email') ||
            scopes.includes('openid') ||
            scopes.includes('profile')) && (
            <li>
              <FormattedMessage {...messages.readProfile} />
            </li>
          )}
          {scopes.includes('resources:manage') && (
            <li>
              <FormattedMessage {...messages.manageResource} />
            </li>
          )}
        </ul>
      </div>
      <div className="has-text-centered">
        <Button className={`mx-3 my-3 ${styles.button}`} disabled={generating} onClick={onDeny}>
          <FormattedMessage {...messages.deny} />
        </Button>
        <Button
          className={`mx-3 my-3 ${styles.button}`}
          color="primary"
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
