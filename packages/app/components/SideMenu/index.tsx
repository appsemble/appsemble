import { connect } from 'react-redux';

import { State } from '../../actions';
import { closeMenu } from '../../actions/menu';
import SideMenu, { SideMenuProps } from './SideMenu';

function mapStateToProps(state: State): Partial<SideMenuProps> {
  return {
    isOpen: state.menu.isOpen,
  };
}

export default connect(mapStateToProps, {
  closeMenu,
})(SideMenu);
