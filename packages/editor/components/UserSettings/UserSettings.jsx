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

  state = { user: undefined, loading: true, submitting: false };

  async componentDidMount() {
    const { data: user } = await axios.get('/api/user');
    this.setState({ user, loading: false });
  }

  onNameChange = event => {
    const { user } = this.state;

    this.setState({ user: { ...user, name: event.target.value } });
  };

  onSaveProfile = async event => {
    const { user } = this.state;
    const { push, intl } = this.props;
    event.preventDefault();

    try {
      this.setState({ submitting: true });
      const { data: updatedUser } = await axios.put('/api/user', user);
      this.setState({ user: updatedUser, submitting: false }, () => {
        push({ body: intl.formatMessage(messages.submitSuccess), color: 'success' });
      });
    } catch (e) {
      push(intl.formatMessage(messages.submitError));
    }
  };

  render() {
    const { user, loading, submitting } = this.state;
    const { intl } = this.props;

    if (loading) {
      return <Loader />;
    }

    return (
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
              value={user.name}
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
    );
  }
}
