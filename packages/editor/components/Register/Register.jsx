import { Form } from '@appsemble/react-components';
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
    const redirect = qs.has('redirect') ? qs.get('redirect') : '/_/apps';
    history.replace(redirect);
  }

  onChange = event => {
    const { target } = event;
    this.setState({ [target.name]: target.value });
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
      <React.Fragment>
        <HelmetIntl title={messages.title} />
        <Form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label" htmlFor="inputEmail">
                <FormattedMessage {...messages.usernameLabel} />
              </label>
            </div>
            <div className="field-body">
              <div className="field">
                <div className="control has-icons-left">
                  <input
                    autoComplete="email"
                    className="input"
                    disabled={submitting}
                    id="inputEmail"
                    name="email"
                    onChange={this.onChange}
                    required
                    type="email"
                    value={email}
                  />
                  <span className="icon is-left">
                    <i className="fas fa-envelope" />
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="field is-horizontal">
            <div className="field-label is-normal">
              <label className="label" htmlFor="inputPassword">
                <FormattedMessage {...messages.passwordLabel} />
              </label>
            </div>
            <div className="field-body">
              <div className="field">
                <div className="control has-icons-left">
                  <input
                    autoComplete="new-password"
                    className="input"
                    disabled={submitting}
                    id="inputPassword"
                    name="password"
                    onChange={this.onChange}
                    required
                    type="password"
                    value={password}
                  />
                  <span className="icon is-left">
                    <i className="fas fa-unlock" />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button
            className={classNames('button', 'is-primary', styles.submit)}
            disabled={submitting}
            type="submit"
          >
            <FormattedMessage {...messages.registerButton} />
          </button>
        </Form>
      </React.Fragment>
    );
  }
}
