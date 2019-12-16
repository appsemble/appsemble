import { Loader } from '@appsemble/react-components';
import axios from 'axios';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link, Redirect, RouteComponentProps, useHistory, useLocation } from 'react-router-dom';

import useQuery from '../../hooks/useQuery';
import useUser from '../../hooks/useUser';
import { TokenResponse, UserInfo } from '../../types';
import messages from './messages';
import styles from './OAuth2Connect.css';

const providers = {
  gitlab: {
    title: 'GitLab',
  },
};

interface Params {
  provider: keyof typeof providers;
}

export default function OAuth2Connect({ match }: RouteComponentProps<Params>): React.ReactElement {
  const { provider } = match.params;
  const history = useHistory();
  const location = useLocation();
  const qs = useQuery();
  const { login } = useUser();
  const [profile, setProfile] = React.useState<UserInfo>(null);
  const [isLoading, setLoading] = React.useState(true);
  const [hasError, setError] = React.useState(false);
  const [isSubmitting, setSubmitting] = React.useState(false);

  const { title } = providers[provider];

  React.useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get<TokenResponse | UserInfo>(
          `/api/oauth2/connect/pending?${new URLSearchParams({
            code: qs.get('code'),
            provider,
          })}`,
        );
        if ('access_token' in data) {
          login(data);
          history.replace('/');
          return;
        }
        setProfile(data);
        setLoading(false);
      } catch (err) {
        setError(true);
        setLoading(false);
      }
    })();
  }, [history, login, provider, qs]);

  const submit = React.useCallback(async () => {
    setSubmitting(true);
    try {
      const { data } = await axios.post<TokenResponse>('/api/oauth2/connect/pending', {
        code: qs.get('code'),
        provider,
      });
      login(data);
      history.replace('/');
    } finally {
      setSubmitting(false);
    }
  }, [history, login, provider, qs]);

  if (!Object.prototype.hasOwnProperty.call(providers, provider) || !qs.has('code')) {
    return <Redirect to="/" />;
  }

  if (isLoading) {
    return <Loader />;
  }

  if (hasError) {
    return <Redirect to="/" />;
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
            <h2 className="title">{profile.name}</h2>
          </a>
          {profile.email ? <h5 className="subtitle">{profile.email}</h5> : null}
        </header>
      </div>
      <div className={styles.section}>
        <p className={classNames({ 'has-text-grey-light': isSubmitting })}>
          <FormattedMessage {...messages.confirmText} values={{ provider: title }} />
        </p>
        <button
          className={classNames('button is-primary', { 'is-loading': isSubmitting })}
          disabled={isSubmitting}
          onClick={submit}
          type="button"
        >
          <FormattedMessage {...messages.confirm} />
        </button>
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
    </div>
  );
}
