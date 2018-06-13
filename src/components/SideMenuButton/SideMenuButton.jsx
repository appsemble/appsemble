import {
  Menu,
} from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';

import ToolbarButton from '../ToolbarButton';


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
