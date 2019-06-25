import normalize from '@appsemble/utils/normalize';
import axios from 'axios';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './ConnectOAuth.css';
import messages from './messages';

export default class ConnectOAuth extends React.Component {
  static propTypes = {
    location: PropTypes.shape().isRequired,
    oauthLogin: PropTypes.func.isRequired,
  };

  state = {
    organization: '',
  };

  componentDidMount() {
    const { location } = this.props;

    const params = new URLSearchParams(location.search);

    if (params.has('access_token') && params.has('verified') && params.has('userId')) {
      this.handleOAuthLogin();
    }
  }

  handleOAuthRegister = async () => {
    const { location } = this.props;
    const { organization } = this.state;

    const params = new URLSearchParams(location.search);

    const result = await axios.post('/api/oauth/register', {
      accessToken: params.get('access_token'),
      provider: params.get('provider'),
      refreshToken: params.get('refresh_token'),
      id: params.get('id'),
      organization,
    });

    if (result.status === 201) {
      await this.handleOAuthLogin();
    }
  };

  onChange = event => {
    const { target } = event;

    if (target.name === 'organization') {
      target.value = normalize(target.value);
    }

    this.setState({ [target.name]: target.value });
  };

  handleOAuthLogin() {
    const { location, oauthLogin } = this.props;

    const params = new URLSearchParams(location.search);

    oauthLogin(params.get('access_token'));
  }

  render() {
    const { location } = this.props;
    const { organization } = this.state;

    const params = new URLSearchParams(location.search);

    if (params.has('access_token') && params.has('provider')) {
      return (
        <div className={styles.registerPrompt}>
          <p>
            <FormattedMessage {...messages.greeting} values={{ name: params.get('name') }} />
            <br />
            <FormattedMessage
              {...messages.registerPrompt}
              values={{ provider: params.get('provider') }}
            />
          </p>

          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label" htmlFor="inputOrganization">
                <FormattedMessage {...messages.organizationLabel} />
              </label>
            </div>
            <div className="field-body">
              <div className="field">
                <div className="control has-icons-left">
                  <input
                    className="input"
                    id="inputOrganization"
                    name="organization"
                    onChange={this.onChange}
                    required
                    value={organization}
                  />
                  <span className="icon is-left">
                    <i className="fas fa-briefcase" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            className={classNames('button', 'is-primary', styles.registerButton)}
            onClick={this.handleOAuthRegister}
            type="button"
          >
            <FormattedMessage {...messages.register} />
          </button>
        </div>
      );
    }

    return null;
  }
}
