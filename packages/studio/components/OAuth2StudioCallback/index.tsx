import {
  Button,
  Loader,
  Message,
  Title,
  useLocationString,
  useQuery,
} from '@appsemble/react-components';
import { TokenResponse, UserInfo } from '@appsemble/types';
import { appendOAuth2State, clearOAuth2State, timezone } from '@appsemble/web-utils';
import axios from 'axios';
import classNames from 'classnames';
import { ReactElement, useCallback, useEffect, useState } from 'react';
import { FormattedMessage, MessageDescriptor } from 'react-intl';
import { Link, useHistory, useParams } from 'react-router-dom';

import { ExtendedOAuth2State } from '../../types';
import { logins } from '../../utils/settings';
import { useUser } from '../UserProvider';
import styles from './index.module.css';
import { messages } from './messages';

interface OAuth2StudioCallbackProps {
  session: ExtendedOAuth2State;
}

/**
 * This component handles the callback URL redirect of the user in the OAuth2 login flow.
 *
 * - If the user has logged in using a known account, they are logged in to Appsemble.
 * - If the user is already logged in, they are prompted to link the OAuth2 account to their
 * Appsemble account.
 * - If the user has logged in using an unknown account, they are prompted if they want to link the
 * OAuth2 account to a new or an existing Appsemble account.
 */
export function OAuth2StudioCallback({ session }: OAuth2StudioCallbackProps): ReactElement {
  const history = useHistory();
  const redirect = useLocationString();
  const qs = useQuery();
  const { lang } = useParams<{ lang: string }>();
  const { login, userInfo } = useUser();

  const code = qs.get('code');
  const state = qs.get('state');
  const provider = logins.find((p) => p.authorizationUrl === session?.authorizationUrl);

  const [profile, setProfile] = useState(session?.userinfo);
  const [isLoading, setIsLoading] = useState(true);
  const [linkError, setLinkError] = useState(false);
  const [error, setError] = useState<MessageDescriptor>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finalizeLogin = useCallback(
    (response: TokenResponse) => {
      login(response);
      clearOAuth2State();
      history.replace(session.redirect || '/');
    },
    [history, login, session],
  );

  useEffect(() => {
    async function connect(): Promise<void> {
      try {
        const { data } = await axios.post<TokenResponse | UserInfo>(
          '/api/oauth2/connect/register',
          {
            code,
            authorizationUrl: session.authorizationUrl,
            timezone,
          },
        );
        if ('access_token' in data) {
          finalizeLogin(data);
          return;
        }
        // Prevent the user from calling the oauth2 registration API twice.
        appendOAuth2State({ userinfo: data });
        setProfile(data);
        setIsLoading(false);
      } catch {
        setError(messages.loginError);
        setIsLoading(false);
      }
    }

    if (!session || state !== session.state) {
      setError(messages.invalidState);
    } else if (profile) {
      // The user refreshed the page.
      setIsLoading(false);
    } else {
      connect();
    }
  }, [code, finalizeLogin, profile, session, state]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      const { data } = await axios.post<TokenResponse>('/api/oauth2/connect/pending', {
        code,
        authorizationUrl: session.authorizationUrl,
        timezone,
      });
      finalizeLogin(data);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response.status === 409) {
        setLinkError(true);
      } else {
        setError(messages.loginError);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [code, finalizeLogin, session]);

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
    <div className={`${styles.root} pt-5`}>
      <div className="my-6 mx-3 has-text-centered">
        <header className={`is-flex ${styles.header}`}>
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
        <div className="my-6 mx-3 has-text-centered">
          <p className={classNames('mb-3', { 'has-text-grey-light': isSubmitting })}>
            <FormattedMessage {...messages.confirmLinkText} values={{ provider: provider.name }} />
          </p>
          <Button color="primary" disabled={isSubmitting} loading={isSubmitting} onClick={submit}>
            <FormattedMessage {...messages.confirmLink} />
          </Button>
        </div>
      ) : (
        <>
          <div className="my-6 mx-3 has-text-centered">
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
          <p
            className={classNames('my-6 mx-3 has-text-centered', {
              'has-text-grey-light': isSubmitting,
            })}
          >
            <FormattedMessage
              {...messages.loginInstead}
              values={{
                link: (text: string) =>
                  isSubmitting ? (
                    text
                  ) : (
                    <Link
                      to={{
                        pathname: `/${lang}/login`,
                        search: `?${new URLSearchParams({ redirect })}`,
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
