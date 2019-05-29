import React, { Component } from 'react';
import axios from 'axios';
import { Loader } from '@appsemble/react-components';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export default class UserSettings extends Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
  };

  state = { user: undefined, loading: true };

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
    event.preventDefault();

    const { data: updatedUser } = await axios.put('/api/user', user);
    this.setState({ user: updatedUser });
  };

  render() {
    const { user, loading } = this.state;
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
          <div className="control has-icons-left">
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
          </div>
        </div>
        <div className="control">
          <button className="button is-primary" type="submit">
            <FormattedMessage {...messages.saveProfile} />
          </button>
        </div>
      </form>
    );
  }
}
