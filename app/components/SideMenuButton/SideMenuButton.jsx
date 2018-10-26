import { NavbarBurger } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';

import messages from './messages';
import styles from './SideMenuButton.css';

/**
 * A toolbar button which can be used to open the side menu.
 */
export default class SideMenuButton extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    isOpen: PropTypes.bool.isRequired,
    openMenu: PropTypes.func.isRequired,
  };

  render() {
    const { intl, isOpen, openMenu } = this.props;

    return (
      <NavbarBurger
        active={isOpen}
        aria-label={intl.formatMessage(messages.label)}
        className={styles.root}
        onClick={openMenu}
      />
    );
  }
}
