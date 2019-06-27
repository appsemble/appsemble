import { Form } from '@appsemble/react-components';
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
