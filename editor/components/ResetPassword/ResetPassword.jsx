import { Button, Container, Icon, InputField, Message, MessageBody } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

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
      <Container className={styles.root}>
        <Message color="success">
          <MessageBody>
            <FormattedMessage {...messages.requestSuccess} />
          </MessageBody>
        </Message>
      </Container>
    ) : (
      <Container className={styles.root} component="form" onSubmit={this.onSubmit}>
        {error && (
          <Message color="danger">
            <MessageBody>
              <FormattedMessage {...messages.requestFailed} />
            </MessageBody>
          </Message>
        )}
        <InputField
          autoComplete="email"
          disabled={submitting}
          iconLeft={<Icon fa="envelope" />}
          label={<FormattedMessage {...messages.emailLabel} />}
          name="email"
          onChange={this.onChange}
          required
          type="email"
          value={email}
        />

        <Button className={styles.submit} color="primary" disabled={submitting} type="submit">
          <FormattedMessage {...messages.requestButton} />
        </Button>
      </Container>
    );
  }
}
