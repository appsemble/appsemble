import { Form, Input } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './Register.css';

export default class Register extends React.Component {
  static propTypes = {
    registerEmail: PropTypes.func.isRequired,
    passwordLogin: PropTypes.func.isRequired,
    intl: PropTypes.shape().isRequired,
    history: PropTypes.shape().isRequired,
    location: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
    user: PropTypes.shape(),
  };

  static defaultProps = {
    user: null,
  };

  state = {
    email: '',
    password: '',
    submitting: false,
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

  onChange = (event, value) => {
    this.setState({ [event.target.name]: value });
  };

  onSubmit = async event => {
    event.preventDefault();

    const { email, password } = this.state;
    const { registerEmail, passwordLogin, intl, location, history, push } = this.props;

    this.setState({ submitting: true });

    try {
      await registerEmail(email, password);
      // XXX: Refactor this to a generic exported default config
      const authentication = {
        method: 'email',
        url: '/api/oauth/token',
        refreshURL: '/api/oauth/token',
        clientId: 'appsemble-editor',
        clientSecret: 'appsemble-editor-secret',
        scope: 'apps:read apps:write',
      };
      await passwordLogin(
        authentication.url,
        { username: email, password },
        authentication.refreshURL,
        authentication.clientId,
        authentication.scope,
      );
      push({
        body: intl.formatMessage(messages.registerSuccess),
        color: 'success',
        timeout: 0,
        dismissable: true,
      });

      const params = new URLSearchParams(location.search);
      if (params.has('redirect')) {
        history.replace(params.get('redirect'));
      } else {
        history.replace('/');
      }
    } catch (error) {
      if (error?.response?.status !== 409) {
        push(intl.formatMessage(messages.registerFailed));
      } else if (error.response.data.message === 'User with this email address already exists.') {
        push(intl.formatMessage(messages.emailConflict));
      } else {
        push(intl.formatMessage(messages.registerFailed));
      }

      this.setState({ submitting: false });
    }
  };

  render() {
    const { email, password, submitting } = this.state;

    return (
      <>
        <HelmetIntl title={messages.title} />
        <Form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
          <Input
            autoComplete="email"
            disabled={submitting}
            iconLeft="envelope"
            id="inputEmail"
            label={<FormattedMessage {...messages.usernameLabel} />}
            name="email"
            onChange={this.onChange}
            required
            type="email"
            value={email}
          />
          <Input
            autoComplete="new-password"
            disabled={submitting}
            iconLeft="unlock"
            id="inputPassword"
            label={<FormattedMessage {...messages.passwordLabel} />}
            name="password"
            onChange={this.onChange}
            required
            type="password"
            value={password}
          />

          <button
            className={classNames('button', 'is-primary', styles.submit)}
            disabled={submitting}
            type="submit"
          >
            <FormattedMessage {...messages.registerButton} />
          </button>
        </Form>
      </>
    );
  }
}
