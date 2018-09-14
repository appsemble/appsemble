import {
  Button,
  Container,
  Icon,
  InputField,
  Message,
  MessageBody,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import {
  FormattedMessage,
} from 'react-intl';

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

  onChange = (event) => {
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

  onSubmit = async (event) => {
    event.preventDefault();
    const {
      authentication,
      passwordLogin,
    } = this.props;
    const {
      values,
    } = this.state;

    this.setState({
      error: false,
      submitting: true,
    });
    try {
      await passwordLogin(authentication.url, values, authentication.refreshURL);
    } catch (error) {
      this.setState({
        error: true,
        dirty: false,
        submitting: false,
      });
    }
  };

  render() {
    const {
      dirty,
      error,
      errors,
      submitting,
      values,
    } = this.state;

    return (
      <Container
        className={styles.root}
        component="form"
        onSubmit={this.onSubmit}
      >
        {error && (
          <Message color="danger">
            <MessageBody>
              <FormattedMessage {...messages.loginFailed} />
            </MessageBody>
          </Message>
        )}
        <InputField
          autoComplete="email"
          color={dirty && errors.username ? 'danger' : null}
          disabled={submitting}
          iconLeft={<Icon fa="envelope" />}
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
          iconLeft={<Icon fa="unlock" />}
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          onChange={this.onChange}
          required
          type="password"
          value={values.password}
        />
        <Button
          className={styles.submit}
          color="primary"
          disabled={!dirty || submitting || errors.password || errors.username}
          type="submit"
        >
          <FormattedMessage {...messages.loginButton} />
        </Button>
      </Container>
    );
  }
}
