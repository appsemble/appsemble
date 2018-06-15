import {
  Menu,
} from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';

import ToolbarButton from '../ToolbarButton';


/**
 * A toolbar button which can be used to open the side menu.
 */
export default class SideMenuButton extends React.Component {
  static propTypes = {
    openMenu: PropTypes.func.isRequired,
  };

  onClick = () => {
    const {
      openMenu,
    } = this.props;

    openMenu();
  };

  render() {
    return (
      <ToolbarButton onClick={this.onClick}>
        <Menu />
      </ToolbarButton>
    );
  }
}
