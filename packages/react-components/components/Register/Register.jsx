import { Button, Container, Icon, InputField, Message, MessageBody } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './register.css';
import messages from './messages';

export default class Register extends React.Component {
  static propTypes = {
    register: PropTypes.func.isRequired,
  };

  state = {
    email: '',
    password: '',
    error: false,
    submitting: false,
  };

  onChange = event => {
    const { target } = event;

    this.setState({ [target.name]: target.value, error: false });
  };

  onSubmit = async event => {
    event.preventDefault();

    const { email, password } = this.state;
    const { register } = this.props;

    this.setState({ submitting: true, error: false });

    try {
      await register(email, password);
      this.setState({ submitting: true });
    } catch (error) {
      this.setState({ error: true, submitting: false });
    }
  };

  render() {
    const { email, password, error, submitting } = this.state;

    return (
      <Container className={styles.root} component="form" onSubmit={this.onSubmit}>
        {error && (
          <Message color="danger">
            <MessageBody>
              <FormattedMessage {...messages.registerFailed} />
            </MessageBody>
          </Message>
        )}
        <InputField
          autoComplete="email"
          disabled={submitting}
          iconLeft={<Icon fa="envelope" />}
          label={<FormattedMessage {...messages.usernameLabel} />}
          name="email"
          onChange={this.onChange}
          required
          type="email"
          value={email}
        />
        <InputField
          disabled={submitting}
          iconLeft={<Icon fa="unlock" />}
          label={<FormattedMessage {...messages.passwordLabel} />}
          name="password"
          onChange={this.onChange}
          required
          type="password"
          value={password}
        />
        <Button className={styles.submit} color="primary" disabled={submitting} type="submit">
          <FormattedMessage {...messages.registerButton} />
        </Button>
      </Container>
    );
  }
}
