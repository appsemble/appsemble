import '@fortawesome/fontawesome-free/css/all.css';

import { Button, SocialLoginButton } from '@appsemble/react-bulma';
import axios from 'axios';
import PropTypes from 'prop-types';
import React from 'react';
import { BrowserRouter as Router, Route, Switch, Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';

import styles from './Login.css';
import messages from './messages';
import EmailLogin from '../EmailLogin';
import EditPassword from '../EditPassword';
import Register from '../Register';
import ResetPassword from '../ResetPassword';

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
      <div className={styles.oauthRegisterPrompt}>
        <p>
          <FormattedMessage
            {...messages.greeting}
            values={{ id: params.get('id'), name: params.get('name'), email: params.get('email') }}
          />
        </p>
        <p>
          <FormattedMessage
            {...messages.registerPrompt}
            values={{ provider: params.get('provider') }}
          />
        </p>
        <Button
          className={styles.oauthRegisterButton}
          color="primary"
          onClick={this.handleOAuthRegister}
          type="button"
        >
          <FormattedMessage {...messages.register} />
        </Button>
      </div>
    ) : (
      <Router>
        <Switch>
          <Route component={Register} path="/editor/register" />
          <Route component={ResetPassword} path="/editor/reset-password" />
          <Route component={EditPassword} path="/editor/edit-password" />
          <Route
            path="/editor"
            render={() => (
              <div>
                <EmailLogin
                  authentication={{
                    method: 'email',
                    ...authentication,
                  }}
                />
                <div className={styles.links}>
                  <Link to="/editor/register">
                    <FormattedMessage {...messages.registerLink} />
                  </Link>
                  <Link to="/editor/reset-password">
                    <FormattedMessage {...messages.forgotPasswordLink} />
                  </Link>
                </div>
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
            )}
          />
        </Switch>
      </Router>
    );
  }
}
