import { EmailLogin } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

import HelmetIntl from '../HelmetIntl';
import SocialLoginButton from '../SocialLoginButton';
import styles from './Login.css';
import messages from './messages';

const loginMethods = new Set(window.settings.logins);

export default class Login extends React.Component {
  static propTypes = {
    passwordLogin: PropTypes.func.isRequired,
  };

  onPasswordLogin = async (...args) => {
    const { passwordLogin } = this.props;

    await passwordLogin(...args);
  };

  render() {
    const returnUri = new URLSearchParams({ returnUri: '/_/connect' });

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
          {window.settings.enableRegistration && (
            <Link className={styles.registerLink} to="/_/register">
              <FormattedMessage {...messages.registerLink} />
            </Link>
          )}
          <Link to="/_/reset-password">
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
