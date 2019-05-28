import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class UserSettings extends Component {
  static propTypes = {
    user: PropTypes.shape().isRequired,
  };

  render() {
    const { user } = this.props;
    return <pre>{JSON.stringify(user, null, 2)}</pre>;
  }
}
