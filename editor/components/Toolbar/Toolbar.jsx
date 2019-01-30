import { Button, Icon, Navbar, NavbarBrand, NavbarItem } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';
import { FormattedMessage } from 'react-intl';
import { Link } from 'react-router-dom';

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
      <Navbar className={`is-fixed-top ${styles.root}`} color="dark">
        <NavbarBrand component={Link} to="/">
          <NavbarItem className="title" component="header">
            <img
              alt={intl.formatMessage(messages.iconAlt)}
              className={styles.icon}
              src="/icon-64.png"
            />
            <h1 className="has-text-white title">Appsemble</h1>
          </NavbarItem>
        </NavbarBrand>
        {isLoggedIn && (
          <NavbarBrand>
            <NavbarItem>
              <Button onClick={logout}>
                <Icon fa="sign-out-alt" />
                <span>
                  <FormattedMessage {...messages.logoutButton} />
                </span>
              </Button>
            </NavbarItem>
          </NavbarBrand>
        )}
      </Navbar>
    );
  }
}
