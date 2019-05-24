import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './Register.css';
import messages from './messages';

export default class Register extends React.Component {
  static propTypes = {
    registerEmail: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    password: '',
    organization: '',
    error: false,
    submitting: false,
    success: false,
  };

  onChange = event => {
    const { target } = event;

    if (target.name === 'organization') {
      target.value = target.value.toLowerCase();
    }

    this.setState({ [target.name]: target.value, error: false });
  };

  onSubmit = async event => {
    event.preventDefault();

    const { email, password, organization } = this.state;
    const { registerEmail } = this.props;

    this.setState({ submitting: true, error: false });

    try {
      await registerEmail(email, password, organization);
      this.setState({ submitting: false, success: true });
    } catch (error) {
      this.setState({ error: true, submitting: false, success: false });
    }
  };

  render() {
    const { email, password, organization, error, submitting, success } = this.state;

    return success ? (
      <div className={classNames('container', styles.root)}>
        <article className="message is-success">
          <div className="message-body">
            <FormattedMessage {...messages.registerSuccess} />
          </div>
        </article>
      </div>
    ) : (
      <form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
        {error && (
          <article className="message is-danger">
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
                  disabled={submitting}
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
