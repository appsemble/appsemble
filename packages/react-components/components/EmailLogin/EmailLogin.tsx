import classNames from 'classnames';
import * as PropTypes from 'prop-types';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './EmailLogin.css';
import messages from './messages';

interface Authentication {
  url: string;
  refreshURL: string;
  clientId: string;
  scope: string[];
}

interface EmailLoginValues {
  username: string;
  password: string;
}

export interface EmailLoginProps {
  authentication: Authentication;
  passwordLogin: (
    url: string,
    values: EmailLoginValues,
    refreshURL: string,
    clientId: string,
    scope: string[],
  ) => void;
}

interface EmailLoginState {
  dirty: boolean;
  error: boolean;
  errors: { [K in keyof EmailLoginValues]: boolean };
  submitting: boolean;
  values: EmailLoginValues;
}

/**
 * A form which will let the user login based on an app definition.
 */
export default class EmailLogin extends React.Component<EmailLoginProps, EmailLoginState> {
  static propTypes = {
    /**
     * The authentication instance for which to render an email login form.
     */
    authentication: PropTypes.shape({}).isRequired,
    passwordLogin: PropTypes.func.isRequired,
  };

  state: EmailLoginState = {
    dirty: false,
    error: false,
    errors: {
      password: true,
      username: true,
    },
    submitting: false,
    values: {
      password: '',
      username: '',
    },
  };

  onChange: React.ChangeEventHandler<HTMLInputElement> = event => {
    const { target } = event;

    this.setState(({ errors, values }) => ({
      dirty: true,
      error: false,
      errors: {
        ...errors,
        [target.name]: !target.validity.valid,
      },
      values: {
        ...values,
        [target.name]: target.value,
      },
    }));
  };

  onSubmit: React.FormEventHandler = async event => {
    event.preventDefault();
    const { authentication, passwordLogin } = this.props;
    const { values } = this.state;

    this.setState({
      error: false,
      submitting: true,
    });
    try {
      await passwordLogin(
        authentication.url,
        values,
        authentication.refreshURL,
        authentication.clientId,
        authentication.scope,
      );
    } catch (error) {
      this.setState({
        error: true,
        dirty: false,
        submitting: false,
      });
    }
  };

  render(): React.ReactNode {
    const { dirty, error, errors, submitting, values } = this.state;

    return (
      <form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
        {error && (
          <article className="message is-danger">
            <div className="message-body">
              <FormattedMessage {...messages.loginFailed} />
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
                  className={classNames('input', { 'is-danger': dirty && errors.username })}
                  disabled={submitting}
                  id="inputEmail"
                  name="username"
                  onChange={this.onChange}
                  required
                  type="email"
                  value={values.username}
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
                  autoComplete="current-password"
                  className={classNames('input', { 'is-danger': dirty && errors.password })}
                  disabled={submitting}
                  id="inputPassword"
                  name="password"
                  onChange={this.onChange}
                  required
                  type="password"
                  value={values.password}
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
          disabled={!dirty || submitting || errors.password || errors.username}
          type="submit"
        >
          <FormattedMessage {...messages.loginButton} />
        </button>
      </form>
    );
  }
}
