import { Form, Icon, Input, Loader, Modal } from '@appsemble/react-components';
import axios from 'axios';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { FormattedMessage } from 'react-intl';

import HelmetIntl from '../HelmetIntl';
import messages from './messages';
import styles from './UserSettings.css';

export default class UserSettings extends Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    push: PropTypes.func.isRequired,
    user: PropTypes.shape().isRequired,
    updateUser: PropTypes.func.isRequired,
  };

  state = {
    newUser: { name: '' },
    newEmail: '',
    loading: true,
    submittingEmail: false,
    submittingName: false,
    deletingEmail: null,
  };

  async componentDidMount() {
    const { user } = this.props;
    this.setState({ newUser: { ...user }, loading: false });
  }

  onNameChange = event => {
    const { newUser } = this.state;
    newUser.name = event.target.value;

    this.setState({ newUser });
  };

  onAddNewEmail = async event => {
    event.preventDefault();

    const { newEmail } = this.state;
    const { push, intl, user, updateUser } = this.props;

    this.setState({ submittingEmail: true });

    try {
      await axios.post('/api/user/email', { email: newEmail });

      push({
        body: intl.formatMessage(messages.addEmailSuccess),
        color: 'success',
      });

      updateUser({
        ...user,
        emails: [
          ...user.emails,
          { email: newEmail, verified: false, primary: false },
        ].sort((a, b) => a.email.localeCompare(b.email)),
      });

      this.setState({
        newEmail: '',
      });
    } catch (exception) {
      if (exception?.response?.status === 409) {
        push(intl.formatMessage(messages.addEmailConflict));
      } else {
        push(intl.formatMessage(messages.addEmailError));
      }
    }
    this.setState({ submittingEmail: false });
  };

  setPrimaryEmail = async email => {
    const { user } = this.state;
    const { push, intl, updateUser } = this.props;

    const { data: newUser } = await axios.put('/api/user', { ...user, primaryEmail: email.email });
    push({
      body: intl.formatMessage(messages.primaryEmailSuccess, { email: email.email }),
      color: 'success',
    });

    updateUser(newUser);
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
    const { deletingEmail: email } = this.state;
    const { push, intl, updateUser, user } = this.props;

    await axios.delete('/api/user/email', { data: { email: email.email } });

    updateUser({ ...user, emails: user.emails.filter(e => e.email !== email.email) });

    this.setState({
      deletingEmail: null,
    });
    push({ body: intl.formatMessage(messages.deleteEmailSuccess), color: 'info' });
  };

  onNewEmailChange = event => {
    this.setState({ newEmail: event.target.value });
  };

  onSaveProfile = async event => {
    event.preventDefault();

    const { newUser } = this.state;
    const { push, intl, updateUser } = this.props;

    try {
      this.setState({ submittingName: true });
      const { data: updatedUser } = await axios.put('/api/user', newUser);
      updateUser(updatedUser);
      this.setState({ newUser: updatedUser, submittingName: false }, () => {
        push({ body: intl.formatMessage(messages.submitSuccess), color: 'success' });
      });
    } catch (e) {
      push(intl.formatMessage(messages.submitError));
    }
  };

  render() {
    const {
      newUser,
      loading,
      submittingEmail,
      submittingName,
      newEmail,
      deletingEmail,
    } = this.state;
    const { intl, user } = this.props;

    if (loading) {
      return <Loader />;
    }

    return (
      <>
        <div className="content">
          <HelmetIntl title={messages.title} />
          <Form onSubmit={this.onSaveProfile}>
            <Input
              icon="user"
              label={<FormattedMessage {...messages.displayName} />}
              name="name"
              onChange={this.onNameChange}
              placeholder={intl.formatMessage(messages.displayName)}
              type="text"
              value={newUser.name || ''}
            />
            <div className="control">
              <button className="button is-primary" disabled={submittingName} type="submit">
                <FormattedMessage {...messages.saveProfile} />
              </button>
            </div>
          </Form>
          <hr />
          <h4>
            <FormattedMessage {...messages.emails} />
          </h4>
          <Form onSubmit={this.onAddNewEmail}>
            <Input
              icon="envelope"
              label={<FormattedMessage {...messages.addEmail} />}
              name="newEmail"
              onChange={this.onNewEmailChange}
              placeholder={intl.formatMessage(messages.email)}
              required
              type="email"
              value={newEmail}
            />
            <div className="control">
              <button className="button is-info" disabled={submittingEmail} type="submit">
                <FormattedMessage {...messages.addEmail} />
              </button>
            </div>
          </Form>
          <hr />
          <table className="table">
            <thead>
              <tr>
                <th>
                  <FormattedMessage {...messages.email} />
                </th>
                <th className="has-text-right">
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
                      {email.primary && (
                        <span className="tag is-primary">
                          <FormattedMessage {...messages.primary} />
                        </span>
                      )}
                      {email.verified ? (
                        <span className="tag is-success">
                          <FormattedMessage {...messages.verified} />
                        </span>
                      ) : (
                        <span className="tag is-warning">
                          <FormattedMessage {...messages.unverified} />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className={`has-text-right ${styles.buttonGroup}`}>
                    {email.verified && !email.primary && (
                      <button
                        className="control button is-info"
                        onClick={() => this.setPrimaryEmail(email)}
                        type="button"
                      >
                        <FormattedMessage {...messages.setPrimaryEmail} />
                      </button>
                    )}
                    {!email.verified && (
                      <button
                        className="control button is-outlined"
                        onClick={() => this.resendVerification(email)}
                        type="button"
                      >
                        <FormattedMessage {...messages.resendVerification} />
                      </button>
                    )}
                    {!email.primary && (
                      <button
                        className="control button is-danger"
                        onClick={() => this.onDeleteEmailClick(email)}
                        type="button"
                      >
                        <Icon icon="trash-alt" size="small" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Modal
          className="is-paddingless"
          isActive={!!deletingEmail}
          onClose={this.onCloseDeleteDialog}
          title={<FormattedMessage {...messages.emailWarningTitle} />}
        >
          <div className={styles.dialogContent}>
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
        </Modal>
      </>
    );
  }
}
