import React, { Component } from 'react';
import axios from 'axios';
import { Loader, Modal } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import styles from './UserSettings.css';
import messages from './messages';

export default class UserSettings extends Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
  };

  state = {
    user: undefined,
    newUser: undefined,
    newEmail: '',
    loading: true,
    submitting: false,
    deletingEmail: null,
  };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    this.setState({ user, newUser: user, loading: false });
  }

  onNameChange = event => {
    const { user } = this.state;

    this.setState({ newUser: { ...user, name: event.target.value } });
  };

  onAddNewEmail = async event => {
    event.preventDefault();

    const { newEmail, user } = this.state;
    const { push, intl } = this.props;

    try {
      await axios.post('/api/user/email', { email: newEmail });

      push({
        body: intl.formatMessage(messages.addEmailSuccess),
        color: 'success',
      });

      this.setState({
        newEmail: '',
        user: {
          ...user,
          emails: [...user.emails, { email: newEmail, verified: false, primary: false }].sort(
            (a, b) => a.email.localeCompare(b.email),
          ),
        },
      });
    } catch (exception) {
      if (exception?.response?.status === 409) {
        push(intl.formatMessage(messages.addEmailConflict));
      } else {
        push(intl.formatMessage(messages.addEmailError));
      }
    }
  };

  setPrimaryEmail = async email => {
    const { user } = this.state;
    const { push, intl } = this.props;

    const { data: newUser } = await axios.put('/api/user', { ...user, primaryEmail: email.email });
    push({
      body: intl.formatMessage(messages.primaryEmailSuccess, { email: email.email }),
      color: 'success',
    });
    this.setState({ user: newUser });
  };

  resendVerification = async email => {
    const { push, intl } = this.props;

    await axios.post('/api/email/resend', { email: email.email });
    push({ body: intl.formatMessage(messages.resendVerificationSent), color: 'info' });
  };

  onCloseDeleteDialog = () => {
    this.setState({ deletingEmail: null });
  };

  onDeleteEmailClick = email => {
    this.setState({ deletingEmail: email });
  };

  deleteEmail = async () => {
    const { user, deletingEmail: email } = this.state;
    const { push, intl } = this.props;

    await axios.delete('/api/user/email', { data: { email: email.email } });

    this.setState({
      deletingEmail: null,
      user: { ...user, emails: user.emails.filter(e => e.email !== email.email) },
    });
    push({ body: intl.formatMessage(messages.deleteEmailSuccess), color: 'info' });
  };

  onNewEmailChange = event => {
    this.setState({ newEmail: event.target.value });
  };

  onSaveProfile = async event => {
    event.preventDefault();

    const { newUser } = this.state;
    const { push, intl } = this.props;

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
    const { user, newUser, loading, submitting, newEmail, deletingEmail } = this.state;
    const { intl } = this.props;

    if (loading) {
      return <Loader />;
    }

    return (
      <div className="content">
        <form onSubmit={this.onSaveProfile}>
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
        </form>
        <hr />
        <h4>
          <FormattedMessage {...messages.emails} />
        </h4>
        <form onSubmit={this.onAddNewEmail}>
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
            <button className="button is-info" disabled={submitting} type="submit">
              <FormattedMessage {...messages.addEmail} />
            </button>
          </div>
        </form>
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
                          onClick={() => this.onDeleteEmailClick(email)}
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
        <Modal isActive={!!deletingEmail} onClose={this.onCloseDeleteDialog}>
          <div className="card">
            <header className="card-header">
              <p className="card-header-title">
                <FormattedMessage {...messages.emailWarningTitle} />
              </p>
            </header>
            <div className="card-content">
              <FormattedMessage {...messages.emailWarning} />
            </div>
            <footer className="card-footer">
              {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
              <a
                className="card-footer-item is-link"
                onClick={this.onCloseDeleteDialog}
                onKeyDown={this.onCloseDeleteDialog}
                role="button"
                tabIndex="-1"
              >
                <FormattedMessage {...messages.cancel} />
              </a>
              <button
                className={`card-footer-item button is-danger ${styles.cardFooterButton}`}
                onClick={this.deleteEmail}
                type="button"
              >
                <FormattedMessage {...messages.deleteEmail} />
              </button>
            </footer>
          </div>
        </Modal>
      </div>
    );
  }
}
