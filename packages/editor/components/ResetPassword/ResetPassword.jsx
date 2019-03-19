import { InputField } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from './ResetPassword.css';
import messages from './messages';

export default class ResetPassword extends React.Component {
  static propTypes = {
    requestResetPassword: PropTypes.func.isRequired,
  };

  state = {
    email: '',
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

    const { email } = this.state;
    const { requestResetPassword } = this.props;

    this.setState({ submitting: true, error: false });

    try {
      await requestResetPassword(email);
      this.setState({ submitting: false, success: true });
    } catch (error) {
      this.setState({ error: true, submitting: false, success: false });
    }
  };

  render() {
    const { email, error, submitting, success } = this.state;

    return success ? (
      <div className={classNames('container', styles.root)}>
        <article className={classNames('message', 'is-success')}>
          <div className="message-body">
            <FormattedMessage {...messages.requestSuccess} />
          </div>
        </article>
      </div>
    ) : (
      <form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
        {error && (
          <article className={classNames('message', 'is-danger')}>
            <div className="message-body">
              <FormattedMessage {...messages.requestFailed} />
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
          label={<FormattedMessage {...messages.emailLabel} />}
          name="email"
          onChange={this.onChange}
          required
          type="email"
          value={email}
        />

        <button
          className={classNames('button', 'is-primary', styles.submit)}
          disabled={submitting}
          type="submit"
        >
          <FormattedMessage {...messages.requestButton} />
        </button>
      </form>
    );
  }
}
