import { Input } from '@appsemble/react-components';
import { normalize } from '@appsemble/utils';
import axios from 'axios';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
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

  onChange = (event, value) => {
    const { name } = event.target;

    this.setState({ [name]: name === 'organization' ? normalize(value) : value });
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
          <HelmetIntl title={messages.title} titleValues={{ provider: params.get('provider') }} />
          <p>
            <FormattedMessage {...messages.greeting} values={{ name: params.get('name') }} />
            <br />
            <FormattedMessage
              {...messages.registerPrompt}
              values={{ provider: params.get('provider') }}
            />
          </p>

          <Input
            iconLeft="briefcase"
            label={<FormattedMessage {...messages.organizationLabel} />}
            name="organization"
            onChange={this.onChange}
            required
            value={organization}
          />

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
