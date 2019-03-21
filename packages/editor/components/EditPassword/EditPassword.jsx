import { Button, Container, Icon, InputField, Message, MessageBody } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import styles from './EditPassword.css';
import messages from './messages';

export default class EditPassword extends React.Component {
  static propTypes = {
    resetPassword: PropTypes.func.isRequired,
    location: PropTypes.shape().isRequired,
  };

  state = {
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

    const { password } = this.state;
    const { resetPassword, location } = this.props;
    const token = new URLSearchParams(location.search).get('token');

    this.setState({ submitting: true, error: false });

    try {
      await resetPassword(token, password);
      this.setState({ submitting: false, success: true });
    } catch (error) {
      this.setState({ error: true, submitting: false, success: false });
    }
  };

  render() {
    const { password, error, submitting, success } = this.state;

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
          autoComplete="new-password"
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
          <FormattedMessage {...messages.requestButton} />
        </Button>
      </Container>
    );
  }
}
