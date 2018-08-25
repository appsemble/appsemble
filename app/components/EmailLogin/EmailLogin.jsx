import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  Paper,
  TextField,
} from '@material-ui/core';
import PasswordField from 'material-ui-password-field';
import PropTypes from 'prop-types';
import React from 'react';
import {
  FormattedMessage,
} from 'react-intl';

import FormError from '../FormError';
import styles from './EmailLogin.css';
import messages from './messages';


/**
 * A form which will let the user login based an app definition.
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
      authentication,
    } = this.props;
    const {
      dirty,
      error,
      errors,
      submitting,
      values,
    } = this.state;

    return (
      <Paper
        className={styles.root}
        component="form"
        onSubmit={this.onSubmit}
      >
        <FormError>
          {error && <FormattedMessage {...messages.loginFailed} />}
        </FormError>
        <TextField
          autoComplete="email"
          disabled={submitting}
          error={dirty && errors.username}
          fullWidth
          id={`${authentication.url}-email`}
          label={<FormattedMessage {...messages.usernameLabel} />}
          helperText={(
            <React.Fragment>
              {dirty && errors.username && (
                <FormattedMessage {...messages.usernameError} />
              )}
            </React.Fragment>
          )}
          name="username"
          onChange={this.onChange}
          required
          type="email"
          value={values.username}
        />
        <FormControl
          disabled={submitting}
          error={dirty && errors.password}
          fullWidth
          required
        >
          <InputLabel htmlFor={`${authentication.url}-password`}>
            <FormattedMessage {...messages.passwordLabel} />
          </InputLabel>
          <PasswordField
            autoComplete="current-password"
            id={`${authentication.url}password`}
            name="password"
            onChange={this.onChange}
            value={values.password}
          />
          <FormHelperText id={`${authentication.url}-password-helper-text`}>
            {dirty && errors.password && (
              <FormattedMessage {...messages.passwordError} />
            )}
          </FormHelperText>
        </FormControl>
        <Button
          className={styles.submit}
          color="primary"
          disabled={!dirty || submitting || errors.password || errors.username}
          type="submit"
        >
          <FormattedMessage {...messages.loginButton} />
        </Button>
      </Paper>
    );
  }
}
