import { InputField } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import classNames from 'classnames';

import styles from './EmailLogin.css';
import messages from './messages';

/**
 * A form which will let the user login based on an app definition.
 */
export default class EmailLogin extends React.Component {
  static propTypes = {
    /**
     * The authentication instance for which to render an email login form.
     */
    authentication: PropTypes.shape().isRequired,
    passwordLogin: PropTypes.func.isRequired,
  };

  state = {
    dirty: false,
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

  onChange = event => {
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

  onSubmit = async event => {
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

  render() {
    const { dirty, error, errors, submitting, values } = this.state;

    return (
      <form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
        {error && (
          <article className={classNames('message', 'is-danger')}>
            <div className="message-body">
              <FormattedMessage {...messages.loginFailed} />
            </div>
          </article>
        )}
        <InputField
          autoComplete="email"
          color={dirty && errors.username ? 'danger' : null}
          disabled={submitting}
          iconLeft={
            <span className="icon">
              <i className={classNames('fas', 'fa-envelope')} />
            </span>
          }
          label={<FormattedMessage {...messages.usernameLabel} />}
          name="username"
          onChange={this.onChange}
          required
          type="email"
          value={values.username}
        />
        <InputField
          autoComplete="current-password"
          color={dirty && errors.password ? 'danger' : null}
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
          value={values.password}
        />
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
