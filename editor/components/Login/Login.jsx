import querystring from 'querystring';

import axios from 'axios';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import EmailLogin from '../../../app/components/EmailLogin';

export default class Login extends React.Component {
  state = {};

  async handleOAuthRegister(accessToken, provider, refreshToken, id) {
    const { authentication, oauthLogin } = this.props;
    const result = await axios.post('/api/oauth/register', {
      accessToken,
      provider,
      refreshToken,
      id,
    });

    if (result.status === 201) {
      // XXX: Implement dispatch logic
      oauthLogin(
        authentication.url,
        accessToken,
        refreshToken,
        authentication.refreshURL,
        authentication.clientId,
        authentication.scope,
      );
    }

    return result;
  }

  render() {
    const {
      authentication,
      location,
      user: { initialized },
    } = this.props;

    const {
      provider,
      access_token: accessToken,
      refresh_token: refreshToken,
      id,
      name,
      email,
    } = querystring.parse(location.search.substr(1));

    return accessToken && provider && initialized ? (
      <div>
        <FormattedMessage {...messages.greeting} values={{ id, name, email }} />
        <br />
        <FormattedMessage {...messages.registerPrompt} values={{ provider }} />
        <button
          onClick={() => this.handleOAuthRegister(accessToken, provider, refreshToken, id)}
          type="button"
        >
          <FormattedMessage {...messages.register} />
        </button>
      </div>
    ) : (
      <div>
        <EmailLogin
          key="appsemble-editor-email-login"
          authentication={{
            method: 'email',
            ...authentication,
          }}
        />
        <div>
          <a href="/api/oauth/connect/google">
            <FormattedMessage {...messages.login} values={{ provider: <span>Google</span> }} />
          </a>
          <a href="/api/oauth/connect/gitlab">
            <FormattedMessage {...messages.login} values={{ provider: <span>GitLab</span> }} />
          </a>
        </div>
      </div>
    );
  }
}
