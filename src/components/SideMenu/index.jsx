import {
  connect,
} from 'react-redux';

import {
  closeMenu,
} from '../../actions/menu';
import SideMenu from './SideMenu';


function mapStateToProps(state) {
  return {
    isOpen: state.menu.isOpen,
  };
}


export default connect(mapStateToProps, {
  closeMenu,
})(SideMenu);
