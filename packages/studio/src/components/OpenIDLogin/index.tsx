import { Button, Content, Loader, Message, useQuery } from '@appsemble/react-components';
import type { App } from '@appsemble/types';
import axios from 'axios';
import React, {
  ComponentPropsWithoutRef,
  ReactElement,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import { oauth2Redirect, verifyOAuth2LoginRequest } from '../../utils/oauth2Utils';
import HelmetIntl from '../HelmetIntl';
import styles from './index.css';
import messages from './messages';

/**
 * Handle login to apps using OAuth2.
 */
export default function OpenIDLogin(): ReactElement {
  const qs = useQuery();

  const [appLoading, setAppLoading] = useState(true);
  const [app, setApp] = useState<App>();
  const [error, setError] = useState<ComponentPropsWithoutRef<typeof FormattedMessage>>(null);
  const [generating, setGenerating] = useState(false);

  const scopes = useMemo(() => qs.get('scope')?.split(' '), [qs]);

  const onAccept = useCallback(() => {
    setGenerating(true);
    axios
      .post('/api/oauth2/authorization-code', {
        appId: app.id,
        redirectUri: qs.get('redirect_uri'),
        scope: Array.from(new Set(scopes)).join(' '),
      })
      .then(({ data }) => oauth2Redirect(qs, { code: data.code }))
      .catch(() => oauth2Redirect(qs, { error: 'server_error' }));
  }, [app, qs, scopes]);

  const onDeny = useCallback(() => {
    oauth2Redirect(qs, { error: 'access_denied' });
  }, [qs]);

  useEffect(() => {
    try {
      if (!verifyOAuth2LoginRequest(qs, ['email', 'openid', 'profile', 'resources:manage'])) {
        return;
      }
    } catch (err) {
      setError(messages.missingRedirectUri);
      return;
    }

    const clientId = qs.get('client_id');
    const appIdMatch = clientId.match(/^app:(\d+)$/);
    if (!appIdMatch) {
      setError({ ...messages.invalidClientId, values: { clientId } });
      return;
    }

    axios
      .get<App>(`/api/apps/${appIdMatch[1]}`)
      .then(({ data }) => setApp(data))
      .catch(() => setError(messages.unknownError))
      .finally(() => setAppLoading(false));
  }, [qs]);

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
      <HelmetIntl title={messages.title} titleValues={{ app: app.definition.name }} />
      <div className="content">
        <p>
          <FormattedMessage
            {...messages.prompt}
            values={{
              app: (
                <Link className="has-text-weight-bold is-italic" to={`/appa/${app.id}`}>
                  {app.definition.name}
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
