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
    /**
     * The title to render.
     */
    children: PropTypes.node,
  };

  static defaultProps = {
    children: 'Appsemble',
  };

  render() {
    const { children } = this.props;

    return (
      <Portal element={document.getElementsByClassName('navbar')[0]}>
        <NavbarBrand>
          <NavbarItem>
            <SideMenuButton />
          </NavbarItem>
          <NavbarItem className="title" component="h2">
            {children}
          </NavbarItem>
        </NavbarBrand>
      </Portal>
    );
  }
}
