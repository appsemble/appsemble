import {
  Drawer,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React from 'react';

import styles from './SideMenu.css';


/**
 * A side menu whose open state is managed by the redux state.
 */
export default class SideMenu extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired,
    closeMenu: PropTypes.func.isRequired,
    isOpen: PropTypes.bool.isRequired,
  };

  render() {
    const {
      children,
      closeMenu,
      isOpen,
    } = this.props;

    return (
      <Drawer
        classes={{ paper: styles.paper }}
        open={isOpen}
        onClose={closeMenu}
      >
        {children}
      </Drawer>
    );
  }
}
