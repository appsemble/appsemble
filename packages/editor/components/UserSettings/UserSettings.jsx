import React, { Component } from 'react';
import axios from 'axios';
import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import styles from './UserSettings.css';
import messages from './messages';

export default class UserSettings extends Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
  };

  state = { user: undefined, newUser: undefined, loading: true, submitting: false };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    user.emails = [
      ...user.emails,
      { email: 'test@example.com', verified: true, primary: false },
      { email: 'test2@example.com', verified: false, primary: false },
    ];
    this.setState({ user, newUser: user, loading: false });
  }

  onNameChange = event => {
    const { user } = this.state;

    this.setState({ newUser: { ...user, name: event.target.value } });
  };

  onAddNewEmail = async () => {
    const { newEmail, user } = this.state;
    const { push, intl } = this.props;

    await axios.post('/api/user/email', { email: newEmail });

    push({
      body: intl.formatMessage(messages.addEmailSuccess),
      color: 'success',
    });

    this.setState({
      newEmail: '',
      user: {
        ...user,
        emails: [...user.emails, { email: newEmail, verified: false, primary: false }],
      },
    });
  };

  setPrimaryEmail = async email => {
    const { user } = this.state;
    const { push, intl } = this.props;

    await axios.put('/api/user', { ...user, primaryEmail: email.email });
    push({
      body: intl.formatMessage(messages.primaryEmailSuccess, { email: email.email }),
      color: 'success',
    });
  };

  resendVerification = async email => {
    const { push, intl } = this.props;

    await axios.post('/api/email/resend', { email: email.email });
    push({ body: intl.formatMessage(messages.resendVerificationSent), color: 'info' });
  };

  deleteEmail = async email => {
    const { user } = this.state;
    const { push, intl } = this.props;

    await axios.delete('/api/user/email', { email: email.email });

    this.setState({ user: { ...user, emails: user.emails.map(e => e.email !== email.email) } });
    push({ body: intl.formatMessage(messages.deleteEmailSuccess), color: 'info' });
  };

  onNewEmailChange = event => {
    this.setState({ newEmail: event.target.value });
  };

  onSaveProfile = async event => {
    const { newUser } = this.state;
    const { push, intl } = this.props;
    event.preventDefault();

    try {
      this.setState({ submitting: true });
      const { data: updatedUser } = await axios.put('/api/user', newUser);
      this.setState({ user: updatedUser, newUser: updatedUser, submitting: false }, () => {
        push({ body: intl.formatMessage(messages.submitSuccess), color: 'success' });
      });
    } catch (e) {
      push(intl.formatMessage(messages.submitError));
    }
  };

  render() {
    const { user, newUser, loading, submitting, newEmail } = this.state;
    const { intl } = this.props;

    if (loading) {
      return <Loader />;
    }

    return (
      <form className="content" onSubmit={this.onSaveProfile}>
        <div className="field">
          <label className="label">
            <FormattedMessage {...messages.displayName} />
          </label>
          <div className={`control has-icons-left ${styles.field}`}>
            <input
              className="input"
              name="name"
              onChange={this.onNameChange}
              placeholder={intl.formatMessage(messages.displayName)}
              type="text"
              value={newUser.name}
            />
            <span className="icon is-small is-left">
              <i className="fas fa-user" />
            </span>
            <p className="help">
              <FormattedMessage {...messages.displayNameHelp} />
            </p>
          </div>
        </div>
        <div className="control">
          <button className="button is-primary" disabled={submitting} type="submit">
            <FormattedMessage {...messages.saveProfile} />
          </button>
        </div>
        <hr />
        <h4>
          <FormattedMessage {...messages.emails} />
        </h4>
        <div className="field">
          <label className="label">
            <FormattedMessage {...messages.addEmail} />
          </label>
          <div className={`control has-icons-left ${styles.field}`}>
            <input
              className="input"
              name="newEmail"
              onChange={this.onNewEmailChange}
              placeholder={intl.formatMessage(messages.email)}
              type="email"
              value={newEmail}
            />
            <span className="icon is-small is-left">
              <i className="fas fa-envelope" />
            </span>
          </div>
        </div>
        <div className="control">
          <button
            className="button is-info"
            disabled={submitting}
            onClick={this.onAddNewEmail}
            type="button"
          >
            <FormattedMessage {...messages.addEmail} />
          </button>
        </div>
        <hr />
        <table className="table">
          <thead>
            <tr>
              <th>
                <FormattedMessage {...messages.email} />
              </th>
              <th>
                <FormattedMessage {...messages.actions} />
              </th>
            </tr>
          </thead>
          <tbody>
            {user.emails.map(email => (
              <tr key={email.email}>
                <td>
                  <span>{email.email}</span>
                  <div className={`tags ${styles.tags}`}>
                    {email.primary && <span className="tag is-primary">primary</span>}
                    {email.verified ? (
                      <span className="tag is-success">verified</span>
                    ) : (
                      <span className="tag is-warning">not verified</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="field is-grouped">
                    {email.verified && !email.primary && (
                      <p className="control">
                        <button
                          className="button is-info"
                          disabled={submitting}
                          onClick={() => this.setPrimaryEmail(email)}
                          type="button"
                        >
                          <FormattedMessage {...messages.setPrimaryEmail} />
                        </button>
                      </p>
                    )}
                    {!email.verified && (
                      <p className="control">
                        <button
                          className="button is-outlined"
                          disabled={submitting}
                          onClick={() => this.resendVerification(email)}
                          type="button"
                        >
                          <FormattedMessage {...messages.resendVerification} />
                        </button>
                      </p>
                    )}
                    {!email.primary && (
                      <p className="control">
                        <button
                          className="button is-danger"
                          disabled={submitting}
                          onClick={() => this.deleteEmail(email)}
                          type="button"
                        >
                          <span className="icon is-small">
                            <i className="fas fa-trash-alt" />
                          </span>
                        </button>
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </form>
    );
  }
}
