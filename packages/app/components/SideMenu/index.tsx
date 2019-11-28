import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';

import { State } from '../../actions';
import { closeMenu } from '../../actions/menu';
import SideMenu, { SideMenuProps } from './SideMenu';

function mapStateToProps(state: State): Partial<SideMenuProps> {
  return {
    isOpen: state.menu.isOpen,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    closeMenu,
  })(SideMenu),
);
