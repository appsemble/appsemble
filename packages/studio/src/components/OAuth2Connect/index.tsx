import { Button, Loader, Message, Title, useQuery } from '@appsemble/react-components';
import type { TokenResponse, UserInfo } from '@appsemble/types';
import { appendOAuth2State, clearOAuth2State, loadOAuth2State } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { Link, useHistory, useLocation } from 'react-router-dom';

import useUser from '../../hooks/useUser';
import settings from '../../utils/settings';
import styles from './index.css';
import messages from './messages';

interface ExtendedOAuth2State {
  userinfo?: UserInfo;
}

/**
 * This component handles the callback URL redirect of the user in the OAuth2 login flow.
 *
 * - If the user has logged in using a known account, they are logged in to Appsemble.
 * - If the user is already logged in, they are prompted to link the OAuth2 account to their
 *   Appsemble account.
 * - If the user has logged in using an unknown account, they are prompted if they want to link the
 *   OAuth2 account to a new or an existing Appsemble account.
 */
export default function OAuth2Connect(): React.ReactElement {
  const history = useHistory();
  const location = useLocation();
  const qs = useQuery();
  const { login, userInfo } = useUser();

  const code = qs.get('code');
  const state = qs.get('state');
  const session = React.useMemo(() => loadOAuth2State<ExtendedOAuth2State>(), []);
  const provider = settings.logins.find((p) => p.authorizationUrl === session?.authorizationUrl);

  const [profile, setProfile] = React.useState(session?.userinfo);
  const [isLoading, setLoading] = React.useState(true);
  const [linkError, setLinkError] = React.useState(false);
  const [error, setError] = React.useState<MessageDescriptor>();
  const [isSubmitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    async function connect(): Promise<void> {
      try {
        const { data } = await axios.post<TokenResponse | UserInfo>(
          '/api/oauth2/connect/register',
          {
            code,
            authorizationUrl: session.authorizationUrl,
          },
        );
        if ('access_token' in data) {
          login(data);
          clearOAuth2State();
          history.replace('/');
          return;
        }
        // Prevent the user from calling the oauth2 registration API twice.
        appendOAuth2State({ userinfo: data });
        setProfile(data);
        setLoading(false);
      } catch (err) {
        setError(messages.loginError);
        setLoading(false);
      }
    }

    if (!session || state !== session.state) {
      setError(messages.invalidState);
    } else if (!profile) {
      connect();
    } else {
      // The user refreshed the page.
      setLoading(false);
    }
  }, [code, history, login, profile, qs, session, state]);

  const submit = React.useCallback(async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post<TokenResponse>('/api/oauth2/connect/pending', {
        code,
        authorizationUrl: session.authorizationUrl,
      });
      login(data);
      clearOAuth2State();
      history.replace('/');
    } catch (err) {
      if (err?.response?.status === 409) {
        setLinkError(true);
      } else {
        setError(messages.loginError);
      }
    } finally {
      setSubmitting(false);
    }
  }, [code, history, login, session]);

  if (isLoading) {
    return <Loader />;
  }

  if (error) {
    return (
      <Message color="danger">
        <FormattedMessage {...error} />
      </Message>
    );
  }

  return (
    <div className={styles.root}>
      <div className={styles.section}>
        <header className={styles.header}>
          <a href={profile.profile} rel="noopener noreferrer" target="_blank">
            <figure className="image is-128x128 is-marginless">
              <img alt={profile.name} className="is-rounded" src={profile.picture} />
            </figure>
          </a>
          <a href={profile.profile} rel="noopener noreferrer" target="_blank">
            <Title level={2}>{profile.name}</Title>
          </a>
          {profile.email ? <h5 className="subtitle">{profile.email}</h5> : null}
        </header>
      </div>
      {userInfo ? (
        <div className={styles.section}>
          <p className={classNames({ 'has-text-grey-light': isSubmitting }, styles.confirmText)}>
            <FormattedMessage {...messages.confirmLinkText} values={{ provider: provider.name }} />
          </p>
          <Button color="primary" disabled={isSubmitting} loading={isSubmitting} onClick={submit}>
            <FormattedMessage {...messages.confirmLink} />
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.section}>
            {linkError ? (
              <p
                className={classNames({ 'has-text-grey-light': isSubmitting }, styles.confirmText)}
              >
                <FormattedMessage {...messages.registrationConflict} />
              </p>
            ) : (
              <>
                <p
                  className={classNames(
                    { 'has-text-grey-light': isSubmitting },
                    styles.confirmText,
                  )}
                >
                  <FormattedMessage
                    {...messages.confirmCreateText}
                    values={{ provider: provider.name }}
                  />
                </p>
                <Button
                  color="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  onClick={submit}
                >
                  <FormattedMessage {...messages.confirmCreate} />
                </Button>
              </>
            )}
          </div>
          <p className={classNames(styles.section, { 'has-text-grey-light': isSubmitting })}>
            <FormattedMessage
              {...messages.loginInstead}
              values={{
                a: (text: string) =>
                  isSubmitting ? (
                    text
                  ) : (
                    <Link
                      to={{
                        pathname: '/login',
                        search: `?${new URLSearchParams({
                          redirect: `${location.pathname}${location.search}${location.hash}`,
                        })}`,
                      }}
                    >
                      {text}
                    </Link>
                  ),
              }}
            />
          </p>
        </>
      )}
    </div>
  );
}
