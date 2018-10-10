import { Navbar, NavbarBrand, NavbarItem } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';

import SideMenuButton from '../SideMenuButton';
import styles from './TitleBar.css';

/**
 * The title bar on the top of the page.
 *
 * This displays the app name,
 */
export default class TitleBar extends React.Component {
  static propTypes = {
    app: PropTypes.shape(),
  };

  static defaultProps = {
    app: null,
  };

  render() {
    const { app } = this.props;

    return (
      <Navbar className={styles.root} fixed="top">
        <NavbarBrand>
          <NavbarItem>
            <SideMenuButton />
          </NavbarItem>
          <NavbarItem>{app?.name || 'Appsemble'}</NavbarItem>
        </NavbarBrand>
      </Navbar>
    );
  }
}
