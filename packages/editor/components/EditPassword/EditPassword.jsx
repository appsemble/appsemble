import { Form, Input } from '@appsemble/react-components';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
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

  onChange = (event, value) => {
    this.setState({ [event.target.name]: value, error: false });
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
    return (
      <React.Fragment>
        <HelmetIntl title={messages.title} />
        {success ? (
          <div className={classNames('container', styles.root)}>
            <article className="message is-success">
              <div className="message-body">
                <FormattedMessage {...messages.requestSuccess} />
              </div>
            </article>
          </div>
        ) : (
          <Form className={classNames('container', styles.root)} onSubmit={this.onSubmit}>
            {error && (
              <article className="message is-dangers">
                <div className="message-body">
                  <FormattedMessage {...messages.requestFailed} />
                </div>
              </article>
            )}

            <Input
              autoComplete="new-password"
              disabled={submitting}
              label={<FormattedMessage {...messages.passwordLabel} />}
              name="password"
              onChange={this.onChange}
              required
              type="password"
              value={password}
            />

            <button
              className={classNames('button', 'is-primary', styles.submit)}
              disabled={submitting}
              type="submit"
            >
              <FormattedMessage {...messages.requestButton} />
            </button>
          </Form>
        )}
      </React.Fragment>
    );
  }
}
