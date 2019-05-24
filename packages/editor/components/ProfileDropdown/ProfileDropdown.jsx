import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

import messages from './messages';

export default class ProfileDropdown extends Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    logout: PropTypes.func.isRequired,
  };

  componentWillMount() {}

  componentDidMount() {}

  componentWillReceiveProps(nextProps) {}

  shouldComponentUpdate(nextProps, nextState) {}

  componentWillUpdate(nextProps, nextState) {}

  componentDidUpdate(prevProps, prevState) {}

  componentWillUnmount() {}

  render() {
    const { logout } = this.props;

    return (
      <span className="navbar-item">
        <button className="button" onClick={logout} type="button">
          <span className="icon">
            <i className="fas fa-sign-out-alt" />
          </span>
          <span>
            <FormattedMessage {...messages.logoutButton} />
          </span>
        </button>
      </span>
    );
  }
}
