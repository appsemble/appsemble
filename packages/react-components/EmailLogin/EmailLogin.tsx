import { Authentication } from '@appsemble/types';
import classNames from 'classnames';
import * as React from 'react';
import { FormattedMessage } from 'react-intl';

import Form from '../Form';
import Input from '../Input';
import styles from './EmailLogin.css';
import messages from './messages';

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
    scope: string | string[],
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

  onChange = (event: React.ChangeEvent<HTMLInputElement>, value: string): void => {
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
        [target.name]: value,
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
      <Form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
        {error && (
          <article className="message is-danger">
            <div className="message-body">
              <FormattedMessage {...messages.loginFailed} />
            </div>
          </article>
        )}
        <Input
          autoComplete="email"
          disabled={submitting}
          error={dirty && errors.username}
          iconLeft="envelope"
          label={<FormattedMessage {...messages.usernameLabel} />}
          name="username"
          onChange={this.onChange}
          required
          type="email"
          value={values.username}
        />
        <Input
          autoComplete="current-password"
          disabled={submitting}
          error={dirty && errors.password}
          iconLeft="unlock"
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
      </Form>
    );
  }
}
