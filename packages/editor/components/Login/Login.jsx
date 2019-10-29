import { EmailLogin } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import settings from '../../utils/settings';
import HelmetIntl from '../HelmetIntl';
import SocialLoginButton from '../SocialLoginButton';
import styles from './Login.css';
import messages from './messages';

const loginMethods = new Set(settings.logins);

export default class Login extends React.Component {
  static propTypes = {
    history: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    match: PropTypes.shape().isRequired,
    passwordLogin: PropTypes.func.isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: null,
  };

  componentDidMount() {
    const { location, history, user } = this.props;
    if (!user) {
      return;
    }

    const qs = new URLSearchParams(location.search);
    const redirect = qs.has('redirect') ? qs.get('redirect') : '/apps';
    history.replace(redirect);
  }

  onPasswordLogin = async (...args) => {
    const { location, history, passwordLogin } = this.props;
    const qs = new URLSearchParams(location.search);

    await passwordLogin(...args);
    const redirect = qs.has('redirect') ? qs.get('redirect') : '/apps';
    history.replace(redirect);
  };

  render() {
    const { location } = this.props;
    const returnUri = new URLSearchParams({ returnUri: '/connect' });

    return (
      <div>
        <HelmetIntl title={messages.title} />
        <EmailLogin
          authentication={{
            method: 'email',
            url: '/api/oauth/token',
            refreshURL: '/api/oauth/token',
            clientId: 'appsemble-editor',
            clientSecret: 'appsemble-editor-secret',
            scope: 'apps:read apps:write',
          }}
          passwordLogin={this.onPasswordLogin}
        />
        <div className={styles.links}>
          {settings.enableRegistration && (
            <Link
              className={styles.registerLink}
              to={{ pathname: '/register', search: location.search, hash: location.hash }}
            >
              <FormattedMessage {...messages.registerLink} />
            </Link>
          )}
          <Link to="/reset-password">
            <FormattedMessage {...messages.forgotPasswordLink} />
          </Link>
        </div>
        <div className={styles.socialLogins}>
          {loginMethods.has('google') && (
            <SocialLoginButton
              className={styles.socialButton}
              iconClass="google"
              providerUri={`/api/oauth/connect/google?${returnUri}`}
            >
              <FormattedMessage {...messages.login} values={{ provider: 'Google' }} />
            </SocialLoginButton>
          )}
          {loginMethods.has('gitlab') && (
            <SocialLoginButton
              className={styles.socialButton}
              iconClass="gitlab"
              providerUri={`/api/oauth/connect/gitlab?${returnUri}`}
            >
              <FormattedMessage {...messages.login} values={{ provider: 'GitLab' }} />
            </SocialLoginButton>
          )}
        </div>
      </div>
    );
  }
}
