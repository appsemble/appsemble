import '@fortawesome/fontawesome-free/css/all.css';

import { SocialLoginButton } from '@appsemble/react-bulma';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './login.css';
import messages from './messages';
import EmailLogin from '../EmailLogin';

export default class Login extends React.Component {
  state = {};

  static propTypes = {
    oauthLogin: PropTypes.func.isRequired,
  };

  async componentDidMount() {
    const { location } = this.props;

    if (location.search) {
      const { searchParams } = new URL(window.location);

      if (
        !searchParams.has('access_token') ||
        !searchParams.has('verified') ||
        !searchParams.has('userId')
      ) {
        return;
      }

      this.handleOAuthLogin();
    }
  }

  handleOAuthLogin = async () => {
    const { authentication, location, history, oauthLogin } = this.props;
    const url = new URL(window.location);
    const { searchParams: params } = url;

    oauthLogin(
      authentication.url,
      params.get('access_token'),
      params.get('refresh_token'),
      authentication.refreshURL,
      authentication.clientId,
      authentication.clientSecret,
      authentication.scope,
    );

    // Remove all login-related parameters in the query string but keep all the other values it might have.
    params.delete('name');
    params.delete('id');
    params.delete('email');
    params.delete('access_token');
    params.delete('refresh_token');
    params.delete('provider');
    params.delete('verified');
    params.delete('userId');

    history.replace({ ...location, search: url.search });
  };

  handleOAuthRegister = async () => {
    const params = new URL(window.location).searchParams;
    const result = await axios.post('/api/oauth/register', {
      accessToken: params.get('access_token'),
      provider: params.get('provider'),
      refreshToken: params.get('refresh_token'),
      id: params.get('id'),
    });

    if (result.status === 201) {
      await this.handleOAuthLogin();
    }
  };

  render() {
    const {
      authentication,
      location,
      user: { initialized },
    } = this.props;

    const { searchParams: params } = new URL(window.location);
    const returnUri = new URLSearchParams(`?returnUri=${location.pathname}`).toString();

    return params.has('access_token') && params.has('provider') && initialized ? (
      <div>
        <FormattedMessage
          {...messages.greeting}
          values={{ id: params.get('id'), name: params.get('name'), email: params.get('email') }}
        />
        <br />
        <FormattedMessage
          {...messages.registerPrompt}
          values={{ provider: params.get('provider') }}
        />
        <button onClick={this.handleOAuthRegister} type="button">
          <FormattedMessage {...messages.register} />
        </button>
      </div>
    ) : (
      <div>
        <EmailLogin
          authentication={{
            method: 'email',
            ...authentication,
          }}
        />
        <div className={styles.socialLogins}>
          <SocialLoginButton
            className={styles.socialButton}
            iconClass="google"
            providerUri={`/api/oauth/connect/google?${returnUri}`}
          >
            <FormattedMessage {...messages.login} values={{ provider: 'Google' }} />
          </SocialLoginButton>
          <SocialLoginButton
            className={styles.socialButton}
            iconClass="gitlab"
            providerUri={`/api/oauth/connect/gitlab?${returnUri}`}
          >
            <FormattedMessage {...messages.login} values={{ provider: 'GitLab' }} />
          </SocialLoginButton>
        </div>
      </div>
    );
  }
}
