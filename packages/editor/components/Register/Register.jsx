import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from './Register.css';
import messages from './messages';

export default class Register extends React.Component {
  static propTypes = {
    registerEmail: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    password: '',
    error: false,
    submitting: false,
    success: false,
  };

  onChange = event => {
    const { target } = event;

    this.setState({ [target.name]: target.value, error: false });
  };

  onSubmit = async event => {
    event.preventDefault();

    const { email, password } = this.state;
    const { registerEmail } = this.props;

    this.setState({ submitting: true, error: false });

    try {
      await registerEmail(email, password);
      this.setState({ submitting: false, success: true });
    } catch (error) {
      this.setState({ error: true, submitting: false, success: false });
    }
  };

  render() {
    const { email, password, error, submitting, success } = this.state;

    return success ? (
      <div className={classNames('container', styles.root)}>
        <article className={classNames('message', 'is-success')}>
          <div className="message-body">
            <FormattedMessage {...messages.registerSuccess} />
          </div>
        </article>
      </div>
    ) : (
      <form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
        {error && (
          <article className={classNames('message', 'is-danger')}>
            <div className="message-body">
              <FormattedMessage {...messages.registerFailed} />
            </div>
          </article>
        )}
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
                  <i className={classNames('fas', 'fa-envelope')} />
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
                  <i className={classNames('fas', 'fa-unlock')} />
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
      </form>
    );
  }
}
