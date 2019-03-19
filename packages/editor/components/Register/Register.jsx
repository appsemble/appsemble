import { InputField } from '@appsemble/react-bulma';
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
        <InputField
          autoComplete="email"
          disabled={submitting}
          iconLeft={
            <span className="icon">
              <i className={classNames('fas', 'fa-envelope')} />
            </span>
          }
          label={<FormattedMessage {...messages.usernameLabel} />}
          name="email"
          onChange={this.onChange}
          required
          type="email"
          value={email}
        />
        <InputField
          autoComplete="new-password"
          disabled={submitting}
          iconLeft={
            <span className="icon">
              <i className={classNames('fas', 'fa-unlock')} />
            </span>
          }
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
      </form>
    );
  }
}
