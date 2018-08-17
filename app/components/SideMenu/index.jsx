import {
  connect,
} from 'react-redux';
import {
  withRouter,
} from 'react-router-dom';

import {
  closeMenu,
} from '../../actions/menu';
import SideMenu from './SideMenu';


function mapStateToProps(state) {
  return {
    isOpen: state.menu.isOpen,
  };
}


export default withRouter(connect(mapStateToProps, {
  closeMenu,
})(SideMenu));
