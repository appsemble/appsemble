import {
  Button,
  Icon,
  Navbar,
  NavbarBrand,
  NavbarEnd,
  NavbarItem,
  NavbarStart,
} from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';

import messages from './messages';
import styles from './Toolbar.css';

export default class Toolbar extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    isLoggedIn: PropTypes.bool.isRequired,
  };

  render() {
    const { intl, isLoggedIn, logout } = this.props;

    return (
      <Navbar color="dark">
        <NavbarStart>
          <NavbarBrand>
            <NavbarItem className="title" component="header">
              <img
                alt={intl.formatMessage(messages.iconAlt)}
                className={styles.icon}
                src="/icon-64.png"
              />
              <h1>Appsemble</h1>
            </NavbarItem>
          </NavbarBrand>
        </NavbarStart>
        {isLoggedIn && (
          <NavbarEnd>
            <NavbarItem>
              <Button onClick={logout}>
                <Icon fa="sign-out-alt" />
                <span>
                  <FormattedMessage {...messages.logoutButton} />
                </span>
              </Button>
            </NavbarItem>
          </NavbarEnd>
        )}
      </Navbar>
    );
  }
}
