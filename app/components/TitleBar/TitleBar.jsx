import { NavbarBrand, NavbarItem } from '@appsemble/react-bulma';
import PropTypes from 'prop-types';
import React from 'react';

import Portal from '../Portal';
import SideMenuButton from '../SideMenuButton';

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
      <Portal element={document.getElementsByClassName('navbar')[0]}>
        <NavbarBrand>
          <NavbarItem>
            <SideMenuButton />
          </NavbarItem>
          <NavbarItem className="title" component="h2">
            {app?.name || 'Appsemble'}
          </NavbarItem>
        </NavbarBrand>
      </Portal>
    );
  }
}
