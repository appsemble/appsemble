import {
  Menu,
} from '@material-ui/icons';
import PropTypes from 'prop-types';
import React from 'react';

import ToolbarButton from '../ToolbarButton';
import messages from './messages';


/**
 * A toolbar button which can be used to open the side menu.
 */
export default class SideMenuButton extends React.Component {
  static propTypes = {
    intl: PropTypes.shape().isRequired,
    openMenu: PropTypes.func.isRequired,
  };

  onClick = () => {
    const {
      openMenu,
    } = this.props;

    openMenu();
  };

  render() {
    const {
      intl,
    } = this.props;

    return (
      <ToolbarButton onClick={this.onClick} aria-label={intl.formatMessage(messages.label)}>
        <Menu />
      </ToolbarButton>
    );
  }
}
